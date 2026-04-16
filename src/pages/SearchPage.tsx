import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { searchPosts } from "@/lib/posts";
import { searchUsers } from "@/lib/profiles";
import AppLayout from "@/components/AppLayout";
import PostCard from "@/components/PostCard";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Search, Loader2 } from "lucide-react";
import { Tables } from "@/integrations/supabase/types";

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const q = searchParams.get("q") || "";
  const [query, setQuery] = useState(q);
  const [tab, setTab] = useState<"users" | "posts">("users");
  const [users, setUsers] = useState<Tables<"profiles">[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (q) {
      setQuery(q);
      search(q);
    }
  }, [q]);

  const search = async (term: string) => {
    setLoading(true);
    const [u, p] = await Promise.all([searchUsers(term), searchPosts(term, 1)]);
    setUsers(u);
    setPosts(p.posts);
    setLoading(false);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setSearchParams({ q: query.trim() });
    }
  };

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto space-y-4">
        <form onSubmit={handleSearch}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search users or posts..." value={query} onChange={(e) => setQuery(e.target.value)} className="pl-9" />
          </div>
        </form>

        <div className="flex border-b border-border">
          <button onClick={() => setTab("users")} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab === "users" ? "border-primary text-primary" : "border-transparent text-muted-foreground"}`}>Users</button>
          <button onClick={() => setTab("posts")} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab === "posts" ? "border-primary text-primary" : "border-transparent text-muted-foreground"}`}>Posts</button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : tab === "users" ? (
          users.length === 0 ? <p className="text-center text-muted-foreground py-8">No users found</p> : (
            <div className="space-y-3">
              {users.map((u) => (
                <Link key={u.id} to={`/profile/${u.username}`} className="flex items-center gap-3 bg-card border border-border rounded-lg p-3 hover:bg-muted/50 transition-colors">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={u.avatar_url || undefined} />
                    <AvatarFallback className="bg-primary text-primary-foreground text-sm">{u.username.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-foreground">@{u.username}</p>
                    <p className="text-sm text-muted-foreground line-clamp-1">{u.bio || "No bio"}</p>
                  </div>
                </Link>
              ))}
            </div>
          )
        ) : (
          posts.length === 0 ? <p className="text-center text-muted-foreground py-8">No posts found</p> : (
            <div className="space-y-4">
              {posts.map((p) => <PostCard key={p.id} post={p} />)}
            </div>
          )
        )}
      </div>
    </AppLayout>
  );
}
