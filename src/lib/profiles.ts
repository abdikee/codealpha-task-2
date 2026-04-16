import { supabase } from "@/integrations/supabase/client";

export async function getProfileByUsername(username: string) {
  const { data: profile } = await supabase.from("profiles").select("*").eq("username", username).single();
  if (!profile) return null;

  const [postsRes, followersRes, followingRes] = await Promise.all([
    supabase.from("posts").select("id", { count: "exact", head: true }).eq("user_id", profile.user_id),
    supabase.from("follows").select("id", { count: "exact", head: true }).eq("following_id", profile.user_id),
    supabase.from("follows").select("id", { count: "exact", head: true }).eq("follower_id", profile.user_id),
  ]);

  return {
    ...profile,
    post_count: postsRes.count ?? 0,
    follower_count: followersRes.count ?? 0,
    following_count: followingRes.count ?? 0,
  };
}

export async function getUserPosts(username: string, page: number, limit = 10) {
  const { data: profile } = await supabase.from("profiles").select("user_id").eq("username", username).single();
  if (!profile) return { posts: [], total: 0 };

  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const { data, count } = await supabase
    .from("posts")
    .select("*, profiles!posts_user_id_fkey(username, avatar_url)", { count: "exact" })
    .eq("user_id", profile.user_id)
    .order("created_at", { ascending: false })
    .range(from, to);

  return { posts: data ?? [], total: count ?? 0 };
}

export async function getUserBookmarks(userId: string, page: number, limit = 10) {
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const { data: bookmarks, count } = await supabase
    .from("bookmarks")
    .select("post_id", { count: "exact" })
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (!bookmarks || bookmarks.length === 0) return { posts: [], total: 0 };

  const postIds = bookmarks.map((b) => b.post_id);
  const { data: posts } = await supabase
    .from("posts")
    .select("*, profiles!posts_user_id_fkey(username, avatar_url)")
    .in("id", postIds);

  return { posts: posts ?? [], total: count ?? 0 };
}

export async function getFollowers(userId: string) {
  const { data } = await supabase
    .from("follows")
    .select("follower_id, profiles!follows_follower_id_fkey(username, avatar_url, bio)")
    .eq("following_id", userId);
  return data ?? [];
}

export async function getFollowing(userId: string) {
  const { data } = await supabase
    .from("follows")
    .select("following_id, profiles!follows_following_id_fkey(username, avatar_url, bio)")
    .eq("follower_id", userId);
  return data ?? [];
}

export async function getSuggestions(userId: string) {
  const { data: following } = await supabase.from("follows").select("following_id").eq("follower_id", userId);
  const followingIds = following?.map((f) => f.following_id) ?? [];
  const excludeIds = [...followingIds, userId];

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .not("user_id", "in", `(${excludeIds.join(",")})`)
    .limit(5);

  return data ?? [];
}

export async function searchUsers(query: string) {
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .ilike("username", `%${query}%`)
    .limit(20);
  return data ?? [];
}

export async function updateProfile(userId: string, updates: { bio?: string; avatar_url?: string }) {
  const { error } = await supabase.from("profiles").update(updates).eq("user_id", userId);
  if (error) throw error;
}

export async function uploadAvatar(userId: string, file: File) {
  const ext = file.name.split(".").pop();
  const path = `${userId}/${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
  if (error) throw error;
  const { data } = supabase.storage.from("avatars").getPublicUrl(path);
  await updateProfile(userId, { avatar_url: data.publicUrl });
  return data.publicUrl;
}

export async function isFollowing(followerId: string, followingId: string) {
  const { data } = await supabase.from("follows").select("id").eq("follower_id", followerId).eq("following_id", followingId).maybeSingle();
  return !!data;
}
