import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { fetchFeed } from "@/lib/posts";
import { getSuggestions } from "@/lib/profiles";
import PostCard from "@/components/PostCard";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Tables } from "@/integrations/supabase/types";

type PostWithProfile = {
  id: string; user_id: string; content: string; image_url: string | null; created_at: string; updated_at: string;
  profiles: { username: string; avatar_url: string | null } | null;
};

export default function HomePage() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<PostWithProfile[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [suggestions, setSuggestions] = useState<Tables<"profiles">[]>([]);

  const loadFeed = useCallback(async (p: number) => {
    if (!user) return;
    setLoading(true);
    const result = await fetchFeed(user.id, p);
    if (p === 1) setPosts(result.posts as PostWithProfile[]);
    else setPosts((prev) => [...prev, ...(result.posts as PostWithProfile[])]);
    setTotal(result.total);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    loadFeed(1);
    if (user) getSuggestions(user.id).then(setSuggestions);
  }, [user, loadFeed]);

  const loadMore = () => {
    const next = page + 1;
    setPage(next);
    loadFeed(next);
  };

  return (
    <AppLayout>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Your Feed</h2>
          {loading && posts.length === 0 ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-card border border-border rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <Skeleton className="h-4 w-32" />
                </div>
                <Skeleton className="h-16 w-full" />
                <div className="flex gap-4">
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-5 w-16" />
                </div>
              </div>
            ))
          ) : posts.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-lg">No posts yet</p>
              <p className="text-sm mt-1">Follow people or create a post to get started!</p>
            </div>
          ) : (
            <>
              {posts.map((post) => (
                <PostCard key={post.id} post={post} onDelete={() => setPosts((p) => p.filter((x) => x.id !== post.id))} />
              ))}
              {posts.length < total && (
                <div className="text-center py-4">
                  <Button variant="outline" onClick={loadMore} disabled={loading}>
                    {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Load More
                  </Button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Sidebar */}
        <div className="hidden lg:block space-y-4">
          {suggestions.length > 0 && (
            <div className="bg-card border border-border rounded-lg p-4">
              <h3 className="font-semibold mb-3 text-foreground">Suggested for you</h3>
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
