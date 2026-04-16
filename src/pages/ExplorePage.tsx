import { useState, useEffect } from "react";
import { fetchExplorePosts } from "@/lib/posts";
import { getSuggestions } from "@/lib/profiles";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import AppLayout from "@/components/AppLayout";
import PostCard from "@/components/PostCard";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { Tables } from "@/integrations/supabase/types";

export default function ExplorePage() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [trendingTags, setTrendingTags] = useState<{ tag: string; count: number }[]>([]);
  const [suggestions, setSuggestions] = useState<Tables<"profiles">[]>([]);

  useEffect(() => {
    loadExplore();
  }, [user]);

  const loadExplore = async () => {
    setLoading(true);
    const { posts } = await fetchExplorePosts(1);
    setPosts(posts);

    // Trending hashtags
    const { data: tags } = await supabase
      .from("post_hashtags")
      .select("hashtag_id, hashtags(tag)")
      .limit(100);

    const tagCounts: Record<string, number> = {};
    tags?.forEach((t: any) => {
      const tag = t.hashtags?.tag;
      if (tag) tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    });
    const sorted = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([tag, count]) => ({ tag, count }));
    setTrendingTags(sorted);

    if (user) {
      const s = await getSuggestions(user.id);
      setSuggestions(s);
    }
    setLoading(false);
  };

  return (
    <AppLayout>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Explore</h2>
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : posts.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">No trending posts yet</p>
          ) : (
            posts.map((p) => <PostCard key={p.id} post={p} />)
          )}
        </div>

        <div className="hidden lg:block space-y-4">
          {trendingTags.length > 0 && (
            <div className="bg-card border border-border rounded-lg p-4">
              <h3 className="font-semibold mb-3 text-foreground">Trending Hashtags</h3>
              <div className="space-y-2">
                {trendingTags.map((t) => (
                  <Link key={t.tag} to={`/hashtag/${t.tag}`} className="flex items-center justify-between text-sm group">
                    <span className="text-primary font-medium group-hover:underline">#{t.tag}</span>
                    <span className="text-xs text-muted-foreground">{t.count} posts</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
          {suggestions.length > 0 && (
            <div className="bg-card border border-border rounded-lg p-4">
              <h3 className="font-semibold mb-3 text-foreground">Who to follow</h3>
              <div className="space-y-3">
                {suggestions.map((s) => (
                  <Link key={s.id} to={`/profile/${s.username}`} className="flex items-center gap-3 group">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={s.avatar_url || undefined} />
                      <AvatarFallback className="bg-primary text-primary-foreground text-xs">{s.username.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium text-foreground group-hover:underline">@{s.username}</p>
                      <p className="text-xs text-muted-foreground line-clamp-1">{s.bio || "New user"}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
