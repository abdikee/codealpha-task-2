import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useUnreadCounts } from "@/hooks/useRealtimeNotifications";
import { useState } from "react";
import { Home, Compass, Bell, Mail, Search, Plus, LogOut, User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import CreatePostModal from "@/components/CreatePostModal";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { profile, signOut } = useAuth();
  const { unreadNotifications, unreadMessages } = useUnreadCounts();
  const [searchQ, setSearchQ] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQ.trim()) navigate(`/search?q=${encodeURIComponent(searchQ.trim())}`);
  };

  const navItems = [
    { to: "/", icon: Home, label: "Home" },
    { to: "/explore", icon: Compass, label: "Explore" },
    { to: "/notifications", icon: Bell, label: "Notifications", badge: unreadNotifications },
    { to: "/messages", icon: Mail, label: "Messages", badge: unreadMessages },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Top Nav */}
      <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-md border-b border-border">
        <div className="max-w-5xl mx-auto flex items-center justify-between h-14 px-4">
          <Link to="/" className="text-xl font-bold text-primary tracking-tight">Chilalo</Link>

          <form onSubmit={handleSearch} className="hidden sm:block flex-1 max-w-sm mx-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search..."
                value={searchQ}
                onChange={(e) => setSearchQ(e.target.value)}
                className="pl-9 h-9 bg-muted border-0"
              />
            </div>
          </form>

          <div className="flex items-center gap-1">
            {navItems.map((item) => (
              <Link key={item.to} to={item.to} className="relative p-2 rounded-full hover:bg-muted transition-colors" aria-label={item.label}>
                <item.icon className={`h-5 w-5 ${location.pathname === item.to ? "text-primary" : "text-muted-foreground"}`} />
                {item.badge ? (
                  <span className="absolute -top-0.5 -right-0.5 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full h-4 min-w-4 flex items-center justify-center px-1">
                    {item.badge > 99 ? "99+" : item.badge}
                  </span>
                ) : null}
              </Link>
            ))}
            <Button size="sm" className="ml-2 h-8 px-3" onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4" />
            </Button>
            <Link to={`/profile/${profile?.username}`} className="ml-1 p-1">
              <Avatar className="h-8 w-8">
                <AvatarImage src={profile?.avatar_url || undefined} />
                <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
                  {profile?.username?.charAt(0).toUpperCase() ?? "?"}
                </AvatarFallback>
              </Avatar>
            </Link>
            <button onClick={() => signOut()} className="p-2 rounded-full hover:bg-muted transition-colors" aria-label="Logout">
              <LogOut className="h-5 w-5 text-muted-foreground" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile search */}
      <div className="sm:hidden px-4 pt-2">
        <form onSubmit={handleSearch}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search..." value={searchQ} onChange={(e) => setSearchQ(e.target.value)} className="pl-9 h-9 bg-muted border-0" />
          </div>
        </form>
      </div>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 py-4">
        {children}
      </main>

      {/* Mobile bottom nav */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 bg-card/80 backdrop-blur-md border-t border-border z-50">
        <div className="flex items-center justify-around h-14">
          {navItems.map((item) => (
            <Link key={item.to} to={item.to} className="relative p-2" aria-label={item.label}>
              <item.icon className={`h-6 w-6 ${location.pathname === item.to ? "text-primary" : "text-muted-foreground"}`} />
              {item.badge ? (
                <span className="absolute -top-0.5 -right-0.5 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full h-4 min-w-4 flex items-center justify-center px-1">
                  {item.badge > 99 ? "99+" : item.badge}
                </span>
              ) : null}
            </Link>
          ))}
          <button onClick={() => setCreateOpen(true)} className="p-2">
            <Plus className="h-6 w-6 text-primary" />
          </button>
        </div>
      </nav>

      <CreatePostModal open={createOpen} onClose={() => setCreateOpen(false)} />

      {/* Bottom spacing for mobile nav */}
      <div className="sm:hidden h-16" />
    </div>
  );
}
