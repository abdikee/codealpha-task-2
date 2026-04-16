import { supabase } from "@/integrations/supabase/client";

export async function toggleLike(postId: string, userId: string) {
  const { data: existing } = await supabase.from("likes").select("id").eq("post_id", postId).eq("user_id", userId).maybeSingle();
  if (existing) {
    await supabase.from("likes").delete().eq("id", existing.id);
    return false;
  } else {
    await supabase.from("likes").insert({ post_id: postId, user_id: userId });
    // Create notification for post owner
    const { data: post } = await supabase.from("posts").select("user_id").eq("id", postId).single();
    if (post && post.user_id !== userId) {
      await supabase.from("notifications").insert({ user_id: post.user_id, actor_id: userId, type: "like", post_id: postId });
    }
    await supabase.from("activity_log").insert({ user_id: userId, action: "liked_post", target_id: postId });
    return true;
  }
}

export async function toggleBookmark(postId: string, userId: string) {
  const { data: existing } = await supabase.from("bookmarks").select("id").eq("post_id", postId).eq("user_id", userId).maybeSingle();
  if (existing) {
    await supabase.from("bookmarks").delete().eq("id", existing.id);
    return false;
  } else {
    await supabase.from("bookmarks").insert({ post_id: postId, user_id: userId });
    await supabase.from("activity_log").insert({ user_id: userId, action: "bookmarked", target_id: postId });
    return true;
  }
}

export async function toggleFollow(followerId: string, followingId: string) {
  const { data: existing } = await supabase.from("follows").select("id").eq("follower_id", followerId).eq("following_id", followingId).maybeSingle();
  if (existing) {
    await supabase.from("follows").delete().eq("id", existing.id);
    return false;
  } else {
    await supabase.from("follows").insert({ follower_id: followerId, following_id: followingId });
    await supabase.from("notifications").insert({ user_id: followingId, actor_id: followerId, type: "follow" });
    await supabase.from("activity_log").insert({ user_id: followerId, action: "followed", target_id: followingId });
    return true;
  }
}

export async function addComment(postId: string, userId: string, content: string, parentId?: string) {
  const { data, error } = await supabase
    .from("comments")
    .insert({ post_id: postId, user_id: userId, content, parent_id: parentId ?? null })
    .select("*, profiles!comments_user_id_fkey(username, avatar_url)")
    .single();
  if (error) throw error;

  const { data: post } = await supabase.from("posts").select("user_id").eq("id", postId).single();
  if (post && post.user_id !== userId) {
    await supabase.from("notifications").insert({
      user_id: post.user_id, actor_id: userId,
      type: parentId ? "reply" : "comment",
      post_id: postId, comment_id: data.id,
    });
  }
  await supabase.from("activity_log").insert({ user_id: userId, action: "commented", target_id: postId });
  return data;
}

export async function getPostLikeInfo(postId: string, userId?: string) {
  const { count } = await supabase.from("likes").select("id", { count: "exact", head: true }).eq("post_id", postId);
  let isLiked = false;
  if (userId) {
    const { data } = await supabase.from("likes").select("id").eq("post_id", postId).eq("user_id", userId).maybeSingle();
    isLiked = !!data;
  }
  return { count: count ?? 0, isLiked };
}

export async function getPostBookmarkInfo(postId: string, userId?: string) {
  if (!userId) return false;
  const { data } = await supabase.from("bookmarks").select("id").eq("post_id", postId).eq("user_id", userId).maybeSingle();
  return !!data;
}
