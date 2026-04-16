import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { fetchPostsByHashtag } from "@/lib/posts";
import AppLayout from "@/components/AppLayout";
import PostCard from "@/components/PostCard";
import { Loader2, Hash } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function HashtagPage() {
  const { tag } = useParams<{ tag: string }>();
  const [posts, setPosts] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tag) return;
    loadPosts(1);
  }, [tag]);

  const loadPosts = async (p: number) => {
    setLoading(true);
    const result = await fetchPostsByHashtag(tag!, p);
    if (p === 1) setPosts(result.posts);
    else setPosts((prev) => [...prev, ...result.posts]);
    setTotal(result.total);
    setLoading(false);
  };

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="flex items-center gap-2">
          <Hash className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">{tag}</h2>
          <span className="text-sm text-muted-foreground">({total} posts)</span>
        </div>
        {loading && posts.length === 0 ? (
          <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : posts.length === 0 ? (
          <p className="text-center text-muted-foreground py-12">No posts with this hashtag</p>
        ) : (
          <>
            {posts.map((p) => <PostCard key={p.id} post={p} />)}
            {posts.length < total && (
              <div className="text-center py-4">
                <Button variant="outline" onClick={() => { setPage((p) => p + 1); loadPosts(page + 1); }} disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null} Load More
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
}
