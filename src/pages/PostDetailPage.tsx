import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { fetchPostById } from "@/lib/posts";
import { addComment } from "@/lib/interactions";
import { supabase } from "@/integrations/supabase/client";
import AppLayout from "@/components/AppLayout";
import PostCard from "@/components/PostCard";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, CornerDownRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

type CommentWithProfile = {
  id: string; content: string; user_id: string; post_id: string; parent_id: string | null; created_at: string;
  profiles: { username: string; avatar_url: string | null } | null;
  reply_count?: number;
  replies?: CommentWithProfile[];
};

export default function PostDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [post, setPost] = useState<any>(null);
  const [comments, setComments] = useState<CommentWithProfile[]>([]);
  const [newComment, setNewComment] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!id) return;
    loadPost();
    loadComments();
  }, [id]);

  const loadPost = async () => {
    const data = await fetchPostById(id!, user?.id);
    setPost(data);
    setLoading(false);
  };

  const loadComments = async () => {
    const { data } = await supabase
      .from("comments")
      .select("*, profiles!comments_user_id_fkey(username, avatar_url)")
      .eq("post_id", id!)
      .is("parent_id", null)
      .order("created_at", { ascending: true });

    const topLevel = (data ?? []) as CommentWithProfile[];
    for (const c of topLevel) {
      const { count } = await supabase.from("comments").select("id", { count: "exact", head: true }).eq("parent_id", c.id);
      c.reply_count = count ?? 0;
    }
    setComments(topLevel);
  };

  const handleAddComment = async () => {
    if (!user || !newComment.trim()) return;
    setSubmitting(true);
    try {
      await addComment(id!, user.id, newComment.trim());
      setNewComment("");
      loadComments();
      toast.success("Comment added");
    } catch { toast.error("Failed to add comment"); }
    setSubmitting(false);
  };

  const handleReply = async (parentId: string) => {
    if (!user || !replyContent.trim()) return;
    setSubmitting(true);
    try {
      await addComment(id!, user.id, replyContent.trim(), parentId);
      setReplyTo(null);
      setReplyContent("");
      loadComments();
      toast.success("Reply added");
    } catch { toast.error("Failed to reply"); }
    setSubmitting(false);
  };

  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());
  const [repliesData, setRepliesData] = useState<Record<string, CommentWithProfile[]>>({});

  const toggleReplies = async (commentId: string) => {
    if (expandedReplies.has(commentId)) {
      setExpandedReplies((s) => { const n = new Set(s); n.delete(commentId); return n; });
    } else {
      if (!repliesData[commentId]) {
        const { data } = await supabase
          .from("comments")
          .select("*, profiles!comments_user_id_fkey(username, avatar_url)")
          .eq("parent_id", commentId)
          .order("created_at", { ascending: true });
        setRepliesData((d) => ({ ...d, [commentId]: (data ?? []) as CommentWithProfile[] }));
      }
      setExpandedReplies((s) => new Set(s).add(commentId));
    }
  };

  if (loading) return <AppLayout><div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></AppLayout>;
  if (!post) return <AppLayout><div className="text-center py-12 text-muted-foreground">Post not found</div></AppLayout>;

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto space-y-4">
        <PostCard post={post} />

        {/* Comment form */}
        {user && (
          <div className="bg-card border border-border rounded-lg p-4 space-y-3">
            <Textarea
              placeholder="Write a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value.slice(0, 300))}
              className="min-h-[80px] resize-none"
            />
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">{newComment.length}/300</span>
              <Button onClick={handleAddComment} disabled={!newComment.trim() || submitting} size="sm">
                {submitting && <Loader2 className="h-4 w-4 animate-spin mr-1" />} Comment
              </Button>
            </div>
          </div>
        )}

        {/* Comments */}
        <div className="space-y-3">
          <h3 className="font-semibold text-foreground">Comments ({comments.length})</h3>
          {comments.map((c) => (
            <div key={c.id} className="bg-card border border-border rounded-lg p-4 animate-slide-up">
              <div className="flex items-start gap-3">
                <Link to={`/profile/${c.profiles?.username}`}>
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={c.profiles?.avatar_url || undefined} />
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs">{c.profiles?.username?.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                </Link>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Link to={`/profile/${c.profiles?.username}`} className="text-sm font-medium hover:underline">@{c.profiles?.username}</Link>
                    <span className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}</span>
                  </div>
                  <p className="text-sm mt-1 text-foreground">{c.content}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <button onClick={() => setReplyTo(replyTo === c.id ? null : c.id)} className="text-xs text-muted-foreground hover:text-primary">Reply</button>
                    {(c.reply_count ?? 0) > 0 && (
                      <button onClick={() => toggleReplies(c.id)} className="text-xs text-primary flex items-center gap-1">
                        <CornerDownRight className="h-3 w-3" />
                        {expandedReplies.has(c.id) ? "Hide" : `${c.reply_count}`} {(c.reply_count ?? 0) === 1 ? "reply" : "replies"}
                      </button>
                    )}
                  </div>
                  {replyTo === c.id && user && (
                    <div className="mt-2 space-y-2">
                      <Textarea
                        placeholder={`Reply to @${c.profiles?.username}...`}
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value.slice(0, 300))}
                        className="min-h-[60px] resize-none text-sm"
                      />
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => setReplyTo(null)}>Cancel</Button>
                        <Button size="sm" onClick={() => handleReply(c.id)} disabled={!replyContent.trim() || submitting}>Reply</Button>
                      </div>
                    </div>
                  )}
                  {expandedReplies.has(c.id) && repliesData[c.id]?.map((r) => (
                    <div key={r.id} className="ml-4 mt-3 pl-3 border-l-2 border-border">
                      <div className="flex items-start gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={r.profiles?.avatar_url || undefined} />
                          <AvatarFallback className="bg-muted text-foreground text-[10px]">{r.profiles?.username?.charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-2">
                            <Link to={`/profile/${r.profiles?.username}`} className="text-xs font-medium hover:underline">@{r.profiles?.username}</Link>
                            <span className="text-[10px] text-muted-foreground">{formatDistanceToNow(new Date(r.created_at), { addSuffix: true })}</span>
                          </div>
                          <p className="text-sm mt-0.5 text-foreground">{r.content}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
