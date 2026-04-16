import { useState, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { createPost } from "@/lib/posts";
import { toast } from "sonner";
import { X, Image, Send, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface CreatePostModalProps {
  open: boolean;
  onClose: () => void;
  onCreated?: () => void;
}

export default function CreatePostModal({ open, onClose, onCreated }: CreatePostModalProps) {
  const { user } = useAuth();
  const [content, setContent] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const hashtags = content.match(/#[\w]+/g) ?? [];

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return toast.error("File too large (max 5MB)");
    if (!["image/jpeg", "image/png", "image/gif", "image/webp"].includes(file.type)) return toast.error("Invalid file type");
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async () => {
    if (!user || !content.trim()) return;
    setLoading(true);
    try {
      await createPost(user.id, content.trim(), imageFile ?? undefined);
      toast.success("Post created!");
      setContent("");
      setImageFile(null);
      setImagePreview(null);
      onCreated?.();
      onClose();
    } catch {
      toast.error("Failed to create post");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create Post</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="relative">
            <Textarea
              placeholder="What's on your mind?"
              value={content}
              onChange={(e) => setContent(e.target.value.slice(0, 500))}
              className="min-h-[120px] resize-none text-base"
            />
            <span className={`absolute bottom-2 right-2 text-xs ${content.length > 450 ? "text-destructive" : "text-muted-foreground"}`}>
              {content.length}/500
            </span>
          </div>
          {imagePreview && (
            <div className="relative inline-block">
              <img src={imagePreview} alt="Preview" className="max-h-48 rounded-lg border border-border" />
              <button
                onClick={() => { setImageFile(null); setImagePreview(null); }}
                className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}
          {hashtags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {hashtags.map((tag, i) => (
                <span key={i} className="text-xs bg-accent text-accent-foreground px-2 py-1 rounded-full">{tag}</span>
              ))}
            </div>
          )}
          <div className="flex items-center justify-between">
            <input ref={fileRef} type="file" accept="image/*" onChange={handleImage} className="hidden" />
            <Button variant="ghost" size="sm" onClick={() => fileRef.current?.click()}>
              <Image className="h-5 w-5 mr-1" /> Photo
            </Button>
            <Button onClick={handleSubmit} disabled={!content.trim() || loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Send className="h-4 w-4 mr-1" />}
              Post
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
