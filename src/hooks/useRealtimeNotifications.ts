import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useUnreadCounts() {
  const { user } = useAuth();
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);

  const fetchCounts = async () => {
    if (!user) return;
    const [notifRes, msgRes] = await Promise.all([
      supabase.from("notifications").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("is_read", false),
      supabase.from("messages").select("id", { count: "exact", head: true }).eq("receiver_id", user.id).eq("is_read", false),
    ]);
    setUnreadNotifications(notifRes.count ?? 0);
    setUnreadMessages(msgRes.count ?? 0);
  };

  useEffect(() => {
    fetchCounts();
    if (!user) return;

    const notifChannel = supabase
      .channel("notif-realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` }, () => {
        setUnreadNotifications((c) => c + 1);
      })
      .subscribe();

    const msgChannel = supabase
      .channel("msg-realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `receiver_id=eq.${user.id}` }, () => {
        setUnreadMessages((c) => c + 1);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(notifChannel);
      supabase.removeChannel(msgChannel);
    };
  }, [user]);

  return { unreadNotifications, unreadMessages, refresh: fetchCounts };
}
