import { supabase } from "@/integrations/supabase/client";

export async function createPost(userId: string, content: string, imageFile?: File) {
  let image_url: string | null = null;

  if (imageFile) {
    const ext = imageFile.name.split(".").pop();
    const path = `${userId}/${Date.now()}.${ext}`;
    const { error: uploadErr } = await supabase.storage.from("post-images").upload(path, imageFile);
    if (uploadErr) throw uploadErr;
    const { data: urlData } = supabase.storage.from("post-images").getPublicUrl(path);
    image_url = urlData.publicUrl;
  }

  const { data: post, error } = await supabase
    .from("posts")
    .insert({ user_id: userId, content, image_url })
    .select()
    .single();
  if (error) throw error;

  // Extract and save hashtags
  const tags = content.match(/#[\w]+/g);
  if (tags && post) {
    for (const rawTag of tags) {
      const tag = rawTag.slice(1).toLowerCase();
      let { data: existing } = await supabase.from("hashtags").select("id").eq("tag", tag).single();
      if (!existing) {
        const { data: created } = await supabase.from("hashtags").insert({ tag }).select("id").single();
        existing = created;
      }
      if (existing) {
        await supabase.from("post_hashtags").insert({ post_id: post.id, hashtag_id: existing.id });
      }
    }
  }

  return post;
}

export async function fetchFeed(userId: string, page: number, limit = 10) {
  const { data: following } = await supabase.from("follows").select("following_id").eq("follower_id", userId);
  const followIds = following?.map((f) => f.following_id) ?? [];
  const allIds = [...followIds, userId];

  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const { data, count } = await supabase
    .from("posts")
    .select("*, profiles!posts_user_id_fkey(username, avatar_url)", { count: "exact" })
    .in("user_id", allIds)
    .order("created_at", { ascending: false })
    .range(from, to);

  return { posts: data ?? [], total: count ?? 0, page, limit };
}

export async function fetchExplorePosts(page: number, limit = 20) {
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();

  const { data, count } = await supabase
    .from("posts")
    .select("*, profiles!posts_user_id_fkey(username, avatar_url), likes(count)", { count: "exact" })
    .gte("created_at", twoDaysAgo)
    .order("created_at", { ascending: false })
    .range(from, to);

  return { posts: data ?? [], total: count ?? 0 };
}

export async function fetchPostById(postId: string, userId?: string) {
  const { data: post } = await supabase
    .from("posts")
    .select("*, profiles!posts_user_id_fkey(username, avatar_url)")
    .eq("id", postId)
    .single();

  if (!post) return null;

  const { count: likeCount } = await supabase.from("likes").select("id", { count: "exact", head: true }).eq("post_id", postId);
  const { count: commentCount } = await supabase.from("comments").select("id", { count: "exact", head: true }).eq("post_id", postId);

  let isLiked = false;
  let isBookmarked = false;
  if (userId) {
    const { data: like } = await supabase.from("likes").select("id").eq("post_id", postId).eq("user_id", userId).maybeSingle();
    isLiked = !!like;
    const { data: bm } = await supabase.from("bookmarks").select("id").eq("post_id", postId).eq("user_id", userId).maybeSingle();
    isBookmarked = !!bm;
  }

  return { ...post, like_count: likeCount ?? 0, comment_count: commentCount ?? 0, is_liked: isLiked, is_bookmarked: isBookmarked };
}

export async function searchPosts(query: string, page: number, limit = 10) {
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  const { data, count } = await supabase
    .from("posts")
    .select("*, profiles!posts_user_id_fkey(username, avatar_url)", { count: "exact" })
    .ilike("content", `%${query}%`)
    .order("created_at", { ascending: false })
    .range(from, to);
  return { posts: data ?? [], total: count ?? 0 };
}

export async function fetchPostsByHashtag(tag: string, page: number, limit = 10) {
  const { data: hashtag } = await supabase.from("hashtags").select("id").eq("tag", tag.toLowerCase()).single();
  if (!hashtag) return { posts: [], total: 0 };

  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const { data: postHashtags } = await supabase
    .from("post_hashtags")
    .select("post_id")
    .eq("hashtag_id", hashtag.id);

  const postIds = postHashtags?.map((ph) => ph.post_id) ?? [];
  if (postIds.length === 0) return { posts: [], total: 0 };

  const { data, count } = await supabase
    .from("posts")
    .select("*, profiles!posts_user_id_fkey(username, avatar_url)", { count: "exact" })
    .in("id", postIds)
    .order("created_at", { ascending: false })
    .range(from, to);

  return { posts: data ?? [], total: count ?? 0 };
}
