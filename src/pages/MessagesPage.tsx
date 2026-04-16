import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useSearchParams } from "react-router-dom";
import { getConversations, getThread, sendMessage, markThreadAsRead } from "@/lib/messages";
import { supabase } from "@/integrations/supabase/client";
import AppLayout from "@/components/AppLayout";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { useUnreadCounts } from "@/hooks/useRealtimeNotifications";

type Conversation = {
  partner_id: string;
  profile: { username: string; avatar_url: string | null } | null;
  last_message: { content: string; created_at: string; sender_id: string };
  unread_count: number;
};

type Message = { id: string; sender_id: string; receiver_id: string; content: string; is_read: boolean; created_at: string };

export default function MessagesPage() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedPartner, setSelectedPartner] = useState<string | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<{ username: string; avatar_url: string | null } | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMsg, setNewMsg] = useState("");
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const { refresh } = useUnreadCounts();

  useEffect(() => {
    loadConversations();
    const toUser = searchParams.get("to");
    if (toUser) startConversationWith(toUser);
  }, [user]);

  useEffect(() => {
    if (!user || !selectedPartner) return;
    const channel = supabase
      .channel(`dm-${selectedPartner}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, (payload) => {
        const msg = payload.new as Message;
        if ((msg.sender_id === selectedPartner && msg.receiver_id === user.id) || (msg.sender_id === user.id && msg.receiver_id === selectedPartner)) {
          setMessages((m) => [...m, msg]);
          setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [selectedPartner, user]);

  const loadConversations = async () => {
    if (!user) return;
    const convs = await getConversations(user.id);
    setConversations(convs);
    setLoading(false);
  };

  const startConversationWith = async (username: string) => {
    const { data: profile } = await supabase.from("profiles").select("user_id, username, avatar_url").eq("username", username).single();
    if (profile) {
      setSelectedPartner(profile.user_id);
      setSelectedProfile({ username: profile.username, avatar_url: profile.avatar_url });
      loadThread(profile.user_id);
    }
  };

  const selectConversation = (conv: Conversation) => {
    setSelectedPartner(conv.partner_id);
    setSelectedProfile(conv.profile);
    loadThread(conv.partner_id);
  };

  const loadThread = async (partnerId: string) => {
    if (!user) return;
    const { messages } = await getThread(user.id, partnerId);
    setMessages(messages);
    await markThreadAsRead(user.id, partnerId);
    refresh();
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  };

  const handleSend = async () => {
    if (!user || !selectedPartner || !newMsg.trim()) return;
    try {
      await sendMessage(user.id, selectedPartner, newMsg.trim());
      setNewMsg("");
      loadConversations();
    } catch { toast.error("Failed to send message"); }
  };

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto">
        <h2 className="text-lg font-semibold text-foreground mb-4">Messages</h2>
        <div className="bg-card border border-border rounded-lg overflow-hidden" style={{ height: "calc(100vh - 200px)" }}>
          <div className="flex h-full">
            {/* Conversation list */}
            <div className={`w-full sm:w-80 border-r border-border overflow-y-auto ${selectedPartner ? "hidden sm:block" : ""}`}>
              {conversations.length === 0 ? (
                <p className="text-center text-muted-foreground py-8 text-sm">No conversations yet</p>
              ) : (
                conversations.map((c) => (
                  <button
                    key={c.partner_id}
                    onClick={() => selectConversation(c)}
                    className={`w-full flex items-center gap-3 p-3 hover:bg-muted transition-colors text-left ${selectedPartner === c.partner_id ? "bg-accent" : ""}`}
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={c.profile?.avatar_url || undefined} />
                      <AvatarFallback className="bg-primary text-primary-foreground text-sm">{c.profile?.username?.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-foreground">@{c.profile?.username}</span>
                        {c.unread_count > 0 && (
                          <span className="bg-primary text-primary-foreground text-[10px] rounded-full h-5 min-w-5 flex items-center justify-center px-1">{c.unread_count}</span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{c.last_message.content}</p>
                    </div>
                  </button>
                ))
              )}
            </div>

            {/* Thread */}
            <div className={`flex-1 flex flex-col ${!selectedPartner ? "hidden sm:flex" : "flex"}`}>
              {selectedPartner ? (
                <>
                  <div className="flex items-center gap-3 p-3 border-b border-border">
                    <button onClick={() => setSelectedPartner(null)} className="sm:hidden p-1">
                      <ArrowLeft className="h-5 w-5 text-muted-foreground" />
                    </button>
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={selectedProfile?.avatar_url || undefined} />
                      <AvatarFallback className="bg-primary text-primary-foreground text-xs">{selectedProfile?.username?.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <span className="font-medium text-sm text-foreground">@{selectedProfile?.username}</span>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {messages.map((m) => (
                      <div key={m.id} className={`flex ${m.sender_id === user?.id ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[70%] px-3 py-2 rounded-2xl text-sm ${m.sender_id === user?.id ? "bg-primary text-primary-foreground rounded-br-sm" : "bg-muted text-foreground rounded-bl-sm"}`}>
                          {m.content}
                          <div className={`text-[10px] mt-1 ${m.sender_id === user?.id ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                            {formatDistanceToNow(new Date(m.created_at), { addSuffix: true })}
                          </div>
                        </div>
                      </div>
                    ))}
                    <div ref={bottomRef} />
                  </div>
                  <div className="p-3 border-t border-border flex gap-2">
                    <Input
                      placeholder="Type a message..."
                      value={newMsg}
                      onChange={(e) => setNewMsg(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                      className="flex-1"
                    />
                    <Button onClick={handleSend} disabled={!newMsg.trim()} size="icon">
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-muted-foreground">
                  Select a conversation to start chatting
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
