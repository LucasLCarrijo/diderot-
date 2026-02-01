import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useUnreadCount } from "@/hooks/useNotifications";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  User,
  Rss,
  Heart,
  Users,
  Bell,
  Settings,
  Store,
  BarChart3,
  LogOut,
  ChevronLeft,
} from "lucide-react";

interface AccountSidebarProps {
  profile?: {
    name: string;
    avatar_url: string | null;
    username: string;
  } | null;
}

export function AccountSidebar({ profile }: AccountSidebarProps) {
  const location = useLocation();
  const { user, signOut, hasRole, userRoles } = useAuth();
  const { data: unreadCount } = useUnreadCount();

  const isCreator = hasRole("creator");

  const navigation = [
    { name: "Meu Perfil", href: "/me/profile", icon: User },
    { name: "Meu Feed", href: "/me/feed", icon: Rss },
    { name: "Favoritos", href: "/me/wishlists", icon: Heart },
    { name: "Seguindo", href: "/me/following", icon: Users },
    { 
      name: "Notificações", 
      href: "/notifications", 
      icon: Bell,
      badge: (unreadCount ?? 0) > 0 ? unreadCount : undefined,
    },
    { name: "Configurações", href: "/me/settings", icon: Settings },
  ];

  const creatorNavigation = [
    { name: "Minha Loja", href: "/creator/shop", icon: Store },
    { name: "Analytics", href: "/creator/analytics", icon: BarChart3 },
  ];

  const initials = profile?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || user?.email?.[0]?.toUpperCase() || "U";

  const displayRole = userRoles.includes("creator") 
    ? "Creator" 
    : userRoles.includes("admin") 
    ? "Admin" 
    : "Follower";

  return (
    <aside className="w-64 border-r border-border bg-background min-h-[calc(100vh-4rem)] hidden lg:flex lg:flex-col">
      <div className="p-4 flex-1">
        <Link
          to="/"
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ChevronLeft className="h-4 w-4" />
          Voltar ao site
        </Link>

        {/* User info */}
        <div className="flex items-center gap-3 mb-6">
          <Avatar className="h-12 w-12">
            <AvatarImage src={profile?.avatar_url || undefined} />
            <AvatarFallback className="font-medium">{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{profile?.name || "Usuário"}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            <Badge variant="secondary" className="mt-1 text-xs">
              {displayRole}
            </Badge>
          </div>
        </div>

        <Separator className="mb-4" />

        {/* Main navigation */}
        <nav className="space-y-1">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors relative",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
                {item.badge && (
                  <span className="absolute right-2 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground text-xs">
                    {item.badge > 99 ? "99+" : item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Creator navigation */}
        {isCreator && (
          <>
            <Separator className="my-4" />
            <p className="px-3 mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Creator
            </p>
            <nav className="space-y-1">
              {creatorNavigation.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </>
        )}
      </div>

      {/* Sign out */}
      <div className="p-4 border-t border-border">
        <Button
          variant="ghost"
          className="w-full justify-start text-muted-foreground hover:text-foreground"
          onClick={() => signOut()}
        >
          <LogOut className="h-5 w-5 mr-3" />
          Sair
        </Button>
      </div>
    </aside>
  );
}
