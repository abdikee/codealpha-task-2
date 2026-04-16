import { useState, useEffect, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { getProfileByUsername, getUserPosts, getUserBookmarks, isFollowing, uploadAvatar, updateProfile, getFollowers, getFollowing } from "@/lib/profiles";
import { toggleFollow } from "@/lib/interactions";
import AppLayout from "@/components/AppLayout";
import PostCard from "@/components/PostCard";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Camera, UserPlus, UserMinus, Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";

export default function ProfilePage() {
  const { username } = useParams<{ username: string }>();
  const { user, profile: myProfile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [tab, setTab] = useState<"posts" | "bookmarks" | "activity">("posts");
  const [following, setFollowingState] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [bio, setBio] = useState("");
  const [followersModal, setFollowersModal] = useState(false);
  const [followingModal, setFollowingModal] = useState(false);
  const [followersList, setFollowersList] = useState<any[]>([]);
  const [followingList, setFollowingList] = useState<any[]>([]);
  const [activityLog, setActivityLog] = useState<any[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  const isOwn = user && profileData?.user_id === user.id;

  useEffect(() => {
    if (!username) return;
    loadProfile();
  }, [username, user]);

  const loadProfile = async () => {
    setLoading(true);
    const data = await getProfileByUsername(username!);
    setProfileData(data);
    if (data) {
      const { posts: userPosts } = await getUserPosts(username!, 1);
      setPosts(userPosts);
      setBio(data.bio ?? "");
      if (user && data.user_id !== user.id) {
        const f = await isFollowing(user.id, data.user_id);
        setFollowingState(f);
      }
    }
    setLoading(false);
  };

  const handleFollow = async () => {
    if (!user || !profileData) return;
    const result = await toggleFollow(user.id, profileData.user_id);
    setFollowingState(result);
    setProfileData((p: any) => ({ ...p, follower_count: result ? p.follower_count + 1 : p.follower_count - 1 }));
    toast.success(result ? `Followed @${username}` : `Unfollowed @${username}`);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 2 * 1024 * 1024) return toast.error("Max 2MB");
    try {
      await uploadAvatar(user.id, file);
      await refreshProfile();
      loadProfile();
      toast.success("Avatar updated!");
    } catch { toast.error("Upload failed"); }
  };

  const handleSaveBio = async () => {
    if (!user) return;
    try {
      await updateProfile(user.id, { bio });
      await refreshProfile();
      setEditOpen(false);
      loadProfile();
      toast.success("Profile updated!");
    } catch { toast.error("Update failed"); }
  };

  const loadBookmarks = async () => {
    if (!user) return;
    const { posts } = await getUserBookmarks(user.id, 1);
    setBookmarks(posts);
  };

  const loadActivity = async () => {
    if (!user || !profileData) return;
    const { data } = await supabase
      .from("activity_log")
      .select("*")
      .eq("user_id", profileData.user_id)
      .order("created_at", { ascending: false })
      .limit(20);
    setActivityLog(data ?? []);
  };

  const handleTabChange = (t: typeof tab) => {
    setTab(t);
    if (t === "bookmarks") loadBookmarks();
    if (t === "activity") loadActivity();
  };

  const showFollowers = async () => {
    const data = await getFollowers(profileData.user_id);
    setFollowersList(data);
    setFollowersModal(true);
  };

  const showFollowing = async () => {
    const data = await getFollowing(profileData.user_id);
    setFollowingList(data);
    setFollowingModal(true);
  };

  if (loading) return <AppLayout><div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></AppLayout>;
  if (!profileData) return <AppLayout><div className="text-center py-12 text-muted-foreground">User not found</div></AppLayout>;

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto space-y-4">
        {/* Profile header */}
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-start gap-4">
            <div className="relative">
              <Avatar className="h-20 w-20">
                <AvatarImage src={profileData.avatar_url || undefined} />
                <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-bold">{profileData.username.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              {isOwn && (
                <>
                  <input ref={fileRef} type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
                  <button onClick={() => fileRef.current?.click()} className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-1.5">
                    <Camera className="h-3 w-3" />
                  </button>
                </>
              )}
            </div>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-foreground">@{profileData.username}</h1>
              <p className="text-sm text-muted-foreground mt-1">{profileData.bio || "No bio yet"}</p>
              <div className="flex items-center gap-4 mt-3">
                <span className="text-sm"><strong>{profileData.post_count}</strong> <span className="text-muted-foreground">Posts</span></span>
                <button onClick={showFollowers} className="text-sm hover:underline"><strong>{profileData.follower_count}</strong> <span className="text-muted-foreground">Followers</span></button>
                <button onClick={showFollowing} className="text-sm hover:underline"><strong>{profileData.following_count}</strong> <span className="text-muted-foreground">Following</span></button>
              </div>
              <div className="flex gap-2 mt-3">
                {isOwn ? (
                  <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>Edit Profile</Button>
                ) : (
                  <>
                    <Button size="sm" variant={following ? "outline" : "default"} onClick={handleFollow}>
                      {following ? <><UserMinus className="h-4 w-4 mr-1" />Unfollow</> : <><UserPlus className="h-4 w-4 mr-1" />Follow</>}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => navigate(`/messages?to=${profileData.username}`)}>
                      <Mail className="h-4 w-4 mr-1" /> Message
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border">
          <button onClick={() => handleTabChange("posts")} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab === "posts" ? "border-primary text-primary" : "border-transparent text-muted-foreground"}`}>Posts</button>
          {isOwn && <button onClick={() => handleTabChange("bookmarks")} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab === "bookmarks" ? "border-primary text-primary" : "border-transparent text-muted-foreground"}`}>Bookmarks</button>}
          {isOwn && <button onClick={() => handleTabChange("activity")} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab === "activity" ? "border-primary text-primary" : "border-transparent text-muted-foreground"}`}>Activity</button>}
        </div>

        {/* Tab content */}
        <div className="space-y-4">
          {tab === "posts" && posts.map((p) => <PostCard key={p.id} post={p} />)}
          {tab === "bookmarks" && (bookmarks.length === 0 ? <p className="text-center text-muted-foreground py-8">No bookmarks yet</p> : bookmarks.map((p) => <PostCard key={p.id} post={p} />))}
          {tab === "activity" && (
            activityLog.length === 0 ? <p className="text-center text-muted-foreground py-8">No activity yet</p> : (
              <div className="space-y-2">
                {activityLog.map((a) => (
                  <div key={a.id} className="bg-card border border-border rounded-lg p-3 text-sm text-foreground">
                    <span className="font-medium">{a.action.replace("_", " ")}</span>
                    <span className="text-muted-foreground ml-2">{new Date(a.created_at).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            )
          )}
        </div>

        {/* Edit profile modal */}
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>Edit Profile</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Bio</Label><Textarea value={bio} onChange={(e) => setBio(e.target.value)} className="mt-1" /></div>
              <Button onClick={handleSaveBio}>Save</Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Followers modal */}
        <Dialog open={followersModal} onOpenChange={setFollowersModal}>
          <DialogContent><DialogHeader><DialogTitle>Followers</DialogTitle></DialogHeader>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {followersList.map((f: any) => (
                <Link key={f.follower_id} to={`/profile/${f.profiles?.username}`} className="flex items-center gap-3" onClick={() => setFollowersModal(false)}>
                  <Avatar className="h-8 w-8"><AvatarFallback className="bg-primary text-primary-foreground text-xs">{f.profiles?.username?.charAt(0).toUpperCase()}</AvatarFallback></Avatar>
                  <span className="text-sm font-medium">@{f.profiles?.username}</span>
                </Link>
              ))}
              {followersList.length === 0 && <p className="text-muted-foreground text-sm text-center">No followers</p>}
            </div>
          </DialogContent>
        </Dialog>

        {/* Following modal */}
        <Dialog open={followingModal} onOpenChange={setFollowingModal}>
          <DialogContent><DialogHeader><DialogTitle>Following</DialogTitle></DialogHeader>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {followingList.map((f: any) => (
                <Link key={f.following_id} to={`/profile/${f.profiles?.username}`} className="flex items-center gap-3" onClick={() => setFollowingModal(false)}>
                  <Avatar className="h-8 w-8"><AvatarFallback className="bg-primary text-primary-foreground text-xs">{f.profiles?.username?.charAt(0).toUpperCase()}</AvatarFallback></Avatar>
                  <span className="text-sm font-medium">@{f.profiles?.username}</span>
                </Link>
              ))}
              {followingList.length === 0 && <p className="text-muted-foreground text-sm text-center">Not following anyone</p>}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
