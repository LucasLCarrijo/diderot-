import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useUnreadCount } from "@/hooks/useNotifications";
import { cn } from "@/lib/utils";
import { User, Rss, Heart, Bell, Settings } from "lucide-react";

export function MobileAccountNav() {
  const location = useLocation();
  const { hasRole } = useAuth();
  const { data: unreadCount } = useUnreadCount();

  const navigation = [
    { name: "Feed", href: "/me/feed", icon: Rss },
    { name: "Favoritos", href: "/me/wishlists", icon: Heart },
    { name: "Perfil", href: "/me/profile", icon: User },
    { 
      name: "Alertas", 
      href: "/notifications", 
      icon: Bell,
      badge: (unreadCount ?? 0) > 0 ? unreadCount : undefined,
    },
    { name: "Config", href: "/me/settings", icon: Settings },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border lg:hidden">
      <div className="flex items-center justify-around h-16">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 px-3 py-2 relative",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              <div className="relative">
                <item.icon className="h-5 w-5" />
                {item.badge && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-destructive-foreground text-[10px]">
                    {item.badge > 9 ? "9+" : item.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-medium">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
