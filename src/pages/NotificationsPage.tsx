import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import AppLayout from "@/components/AppLayout";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Heart, MessageCircle, UserPlus, CornerDownRight, Mail, Check, Bell } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { useUnreadCounts } from "@/hooks/useRealtimeNotifications";

type NotifWithActor = {
  id: string; type: string; is_read: boolean; post_id: string | null; comment_id: string | null; created_at: string;
  profiles: { username: string; avatar_url: string | null } | null;
};

const typeIcons: Record<string, React.ReactNode> = {
  like: <Heart className="h-4 w-4 text-like" />,
  comment: <MessageCircle className="h-4 w-4 text-primary" />,
  follow: <UserPlus className="h-4 w-4 text-success" />,
  reply: <CornerDownRight className="h-4 w-4 text-primary" />,
  dm: <Mail className="h-4 w-4 text-primary" />,
  mention: <Bell className="h-4 w-4 text-bookmark" />,
};

const typeText: Record<string, string> = {
  like: "liked your post",
  comment: "commented on your post",
  follow: "started following you",
  reply: "replied to your comment",
  dm: "sent you a message",
  mention: "mentioned you",
};

export default function NotificationsPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotifWithActor[]>([]);
  const [loading, setLoading] = useState(true);
  const { refresh } = useUnreadCounts();

  useEffect(() => { loadNotifications(); }, [user]);

  const loadNotifications = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);

    const notifs = data ?? [];
    const actorIds = [...new Set(notifs.map((n) => n.actor_id))];
    const { data: profiles } = await supabase.from("profiles").select("user_id, username, avatar_url").in("user_id", actorIds);
    const profileMap = new Map((profiles ?? []).map((p) => [p.user_id, p]));

    setNotifications(notifs.map((n) => ({ ...n, profiles: profileMap.get(n.actor_id) ?? null })) as NotifWithActor[]);
    setLoading(false);
  };

  const markAllRead = async () => {
    if (!user) return;
    await supabase.from("notifications").update({ is_read: true }).eq("user_id", user.id).eq("is_read", false);
    setNotifications((n) => n.map((x) => ({ ...x, is_read: true })));
    refresh();
    toast.success("All notifications marked as read");
  };

  const getLink = (n: NotifWithActor) => {
    if (n.type === "follow") return `/profile/${n.profiles?.username}`;
    if (n.type === "dm") return "/messages";
    if (n.post_id) return `/post/${n.post_id}`;
    return "#";
  };

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Notifications</h2>
          <Button variant="outline" size="sm" onClick={markAllRead}>
            <Check className="h-4 w-4 mr-1" /> Mark all read
          </Button>
        </div>
        {notifications.length === 0 ? (
          <p className="text-center text-muted-foreground py-12">No notifications yet</p>
        ) : (
          notifications.map((n) => (
            <Link key={n.id} to={getLink(n)} className={`block bg-card border border-border rounded-lg p-4 transition-colors ${!n.is_read ? "bg-accent/50" : ""}`}>
              <div className="flex items-center gap-3">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={n.profiles?.avatar_url || undefined} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs">{n.profiles?.username?.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground">
                    <span className="font-semibold">@{n.profiles?.username}</span> {typeText[n.type] || n.type}
                  </p>
                  <p className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}</p>
                </div>
                <span>{typeIcons[n.type]}</span>
              </div>
            </Link>
          ))
        )}
      </div>
    </AppLayout>
  );
}
