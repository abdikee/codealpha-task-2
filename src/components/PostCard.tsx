import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { Heart, MessageCircle, Bookmark, MoreHorizontal, Trash2, Edit } from "lucide-react";
import { toggleLike, toggleBookmark, getPostLikeInfo, getPostBookmarkInfo } from "@/lib/interactions";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface PostCardProps {
  post: {
    id: string;
    user_id: string;
    content: string;
    image_url?: string | null;
    created_at: string;
    profiles?: { username: string; avatar_url: string | null } | null;
  };
  onDelete?: () => void;
}

export default function PostCard({ post, onDelete }: PostCardProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [likeCount, setLikeCount] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [commentCount, setCommentCount] = useState(0);
  const [likeAnim, setLikeAnim] = useState(false);

  const profile = post.profiles;
  const isOwner = user?.id === post.user_id;

  useEffect(() => {
    getPostLikeInfo(post.id, user?.id).then(({ count, isLiked }) => {
      setLikeCount(count);
      setIsLiked(isLiked);
    });
    getPostBookmarkInfo(post.id, user?.id).then(setIsBookmarked);
    supabase.from("comments").select("id", { count: "exact", head: true }).eq("post_id", post.id).then(({ count }) => setCommentCount(count ?? 0));
  }, [post.id, user?.id]);

  const handleLike = async () => {
    if (!user) return toast.error("Please sign in to like posts");
    const liked = await toggleLike(post.id, user.id);
    setIsLiked(liked);
    setLikeCount((c) => liked ? c + 1 : c - 1);
    if (liked) setLikeAnim(true);
  };

  const handleBookmark = async () => {
    if (!user) return toast.error("Please sign in to bookmark posts");
    const saved = await toggleBookmark(post.id, user.id);
    setIsBookmarked(saved);
    toast.success(saved ? "Post bookmarked" : "Bookmark removed");
  };

  const handleDelete = async () => {
    const { error } = await supabase.from("posts").delete().eq("id", post.id);
    if (error) return toast.error("Failed to delete post");
    toast.success("Post deleted");
    onDelete?.();
  };

  const renderContent = (text: string) => {
    const parts = text.split(/(#[\w]+)/g);
    return parts.map((part, i) =>
      part.startsWith("#") ? (
        <Link key={i} to={`/hashtag/${part.slice(1)}`} className="text-primary hover:underline font-medium">
          {part}
        </Link>
      ) : (
        <span key={i}>{part}</span>
      )
    );
  };

  return (
    <div className="bg-card border border-border rounded-lg p-4 animate-slide-up hover:shadow-sm transition-shadow">
      <div className="flex items-start gap-3">
        <Link to={`/profile/${profile?.username}`}>
          <Avatar className="h-10 w-10">
            <AvatarImage src={profile?.avatar_url || undefined} />
            <AvatarFallback className="bg-primary text-primary-foreground text-sm font-semibold">
              {profile?.username?.charAt(0).toUpperCase() ?? "?"}
            </AvatarFallback>
          </Avatar>
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Link to={`/profile/${profile?.username}`} className="font-semibold text-foreground hover:underline">
                @{profile?.username}
              </Link>
              <span className="text-muted-foreground text-xs">
                {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
              </span>
            </div>
            {isOwner && (
              <DropdownMenu>
                <DropdownMenuTrigger className="p-1 rounded-full hover:bg-muted transition-colors">
                  <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleDelete} className="text-destructive">
                    <Trash2 className="h-4 w-4 mr-2" /> Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
          <p className="mt-1 text-foreground leading-relaxed">{renderContent(post.content)}</p>
          {post.image_url && (
            <img src={post.image_url} alt="Post" className="mt-3 rounded-lg max-h-96 w-full object-cover border border-border" />
          )}
          <div className="flex items-center gap-6 mt-3">
            <button onClick={handleLike} className="flex items-center gap-1.5 group" aria-label="Like">
              <Heart
                className={`h-5 w-5 transition-all ${isLiked ? "fill-like text-like" : "text-muted-foreground group-hover:text-like"} ${likeAnim ? "animate-like-pop" : ""}`}
                onAnimationEnd={() => setLikeAnim(false)}
              />
              <span className={`text-sm ${isLiked ? "text-like font-medium" : "text-muted-foreground"}`}>{likeCount}</span>
            </button>
            <button onClick={() => navigate(`/post/${post.id}`)} className="flex items-center gap-1.5 group" aria-label="Comments">
              <MessageCircle className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
              <span className="text-sm text-muted-foreground">{commentCount}</span>
            </button>
            <button onClick={handleBookmark} className="flex items-center gap-1.5 group" aria-label="Bookmark">
              <Bookmark
                className={`h-5 w-5 transition-all ${isBookmarked ? "fill-bookmark text-bookmark" : "text-muted-foreground group-hover:text-bookmark"}`}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
