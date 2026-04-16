import { supabase } from "@/integrations/supabase/client";

export async function getConversations(userId: string) {
  // Get latest message per conversation partner
  const { data: sent } = await supabase.from("messages").select("*").eq("sender_id", userId).order("created_at", { ascending: false });
  const { data: received } = await supabase.from("messages").select("*").eq("receiver_id", userId).order("created_at", { ascending: false });

  const all = [...(sent ?? []), ...(received ?? [])];
  const convMap = new Map<string, typeof all[0]>();

  for (const msg of all) {
    const partnerId = msg.sender_id === userId ? msg.receiver_id : msg.sender_id;
    const existing = convMap.get(partnerId);
    if (!existing || new Date(msg.created_at) > new Date(existing.created_at)) {
      convMap.set(partnerId, msg);
    }
  }

  const conversations = [];
  for (const [partnerId, lastMsg] of convMap) {
    const { data: profile } = await supabase.from("profiles").select("username, avatar_url").eq("user_id", partnerId).single();
    const { count } = await supabase.from("messages").select("id", { count: "exact", head: true })
      .eq("sender_id", partnerId).eq("receiver_id", userId).eq("is_read", false);
    conversations.push({ partner_id: partnerId, profile, last_message: lastMsg, unread_count: count ?? 0 });
  }

  conversations.sort((a, b) => new Date(b.last_message.created_at).getTime() - new Date(a.last_message.created_at).getTime());
  return conversations;
}

export async function getThread(userId: string, partnerId: string, page = 1, limit = 50) {
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const { data, count } = await supabase
    .from("messages")
    .select("*", { count: "exact" })
    .or(`and(sender_id.eq.${userId},receiver_id.eq.${partnerId}),and(sender_id.eq.${partnerId},receiver_id.eq.${userId})`)
    .order("created_at", { ascending: true })
    .range(from, to);

  return { messages: data ?? [], total: count ?? 0 };
}

export async function sendMessage(senderId: string, receiverId: string, content: string) {
  const { data, error } = await supabase
    .from("messages")
    .insert({ sender_id: senderId, receiver_id: receiverId, content })
    .select()
    .single();
  if (error) throw error;

  await supabase.from("notifications").insert({ user_id: receiverId, actor_id: senderId, type: "dm" });
  return data;
}

export async function markThreadAsRead(userId: string, partnerId: string) {
  await supabase
    .from("messages")
    .update({ is_read: true })
    .eq("sender_id", partnerId)
    .eq("receiver_id", userId)
    .eq("is_read", false);
}
