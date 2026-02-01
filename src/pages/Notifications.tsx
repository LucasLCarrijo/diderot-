import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  useNotifications,
  useMarkAsRead,
  useMarkAllAsRead,
  useClearAllNotifications,
} from "@/hooks/useNotifications";
import { SiteHeader } from "@/components/site/SiteHeader";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Bell, CheckCheck, Trash2, UserPlus, Heart } from "lucide-react";
import { formatDistanceToNow, isToday, isYesterday, isThisWeek } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

export default function Notifications() {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { data: notifications, isLoading } = useNotifications();
  const markAsRead = useMarkAsRead();
  const markAllAsRead = useMarkAllAsRead();
  const clearAll = useClearAllNotifications();
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth/signin");
    }
  }, [user, authLoading, navigate]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  const filteredNotifications = notifications?.filter((n) => {
    if (activeTab === "all") return true;
    if (activeTab === "unread") return !n.read;
    if (activeTab === "follows") return n.type === "follow";
    if (activeTab === "favorites") return n.type === "favorite";
    return true;
  });

  // Group notifications by date
  const groupedNotifications = filteredNotifications?.reduce((acc, notification) => {
    const date = new Date(notification.created_at);
    let group = "Mais antigo";
    
    if (isToday(date)) {
      group = "Hoje";
    } else if (isYesterday(date)) {
      group = "Ontem";
    } else if (isThisWeek(date)) {
      group = "Esta semana";
    }

    if (!acc[group]) {
      acc[group] = [];
    }
    acc[group].push(notification);
    return acc;
  }, {} as Record<string, typeof filteredNotifications>);

  const handleNotificationClick = (notification: any) => {
    if (!notification.read) {
      markAsRead.mutate(notification.id);
    }
    if (notification.action_url) {
      navigate(notification.action_url);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "follow":
        return <UserPlus className="h-4 w-4 text-primary" />;
      case "favorite":
        return <Heart className="h-4 w-4 text-red-500" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const unreadCount = notifications?.filter((n) => !n.read).length || 0;

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Notificações</h1>
            <p className="text-muted-foreground">
              {unreadCount > 0
                ? `${unreadCount} não lida${unreadCount > 1 ? "s" : ""}`
                : "Todas lidas"}
            </p>
          </div>
          <div className="flex gap-2">
            {unreadCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => markAllAsRead.mutate()}
                disabled={markAllAsRead.isPending}
              >
                <CheckCheck className="h-4 w-4 mr-2" />
                Marcar todas
              </Button>
            )}
            {notifications && notifications.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => clearAll.mutate()}
                disabled={clearAll.isPending}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Limpar
              </Button>
            )}
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="all">Todas</TabsTrigger>
            <TabsTrigger value="unread">Não lidas</TabsTrigger>
            <TabsTrigger value="follows">Seguidores</TabsTrigger>
            <TabsTrigger value="favorites">Favoritos</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab}>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex gap-4 p-4 border rounded-lg">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/4" />
                    </div>
                  </div>
                ))}
              </div>
            ) : groupedNotifications && Object.keys(groupedNotifications).length > 0 ? (
              <div className="space-y-6">
                {Object.entries(groupedNotifications).map(([group, items]) => (
                  <div key={group}>
                    <h3 className="text-sm font-medium text-muted-foreground mb-3">
                      {group}
                    </h3>
                    <div className="space-y-2">
                      {items?.map((notification) => (
                        <div
                          key={notification.id}
                          className={cn(
                            "flex items-start gap-4 p-4 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors",
                            !notification.read && "bg-primary/5 border-primary/20"
                          )}
                          onClick={() => handleNotificationClick(notification)}
                        >
                          <div className="relative">
                            <Avatar className="h-12 w-12">
                              <AvatarImage
                                src={(notification as any).actor?.avatar_url || ""}
                              />
                              <AvatarFallback>
                                {(notification as any).actor?.name?.[0] || "?"}
                              </AvatarFallback>
                            </Avatar>
                            <span className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-background border flex items-center justify-center">
                              {getNotificationIcon(notification.type)}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium">{notification.title}</p>
                            <p className="text-sm text-muted-foreground">
                              {notification.message}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {formatDistanceToNow(new Date(notification.created_at), {
                                addSuffix: true,
                                locale: ptBR,
                              })}
                            </p>
                          </div>
                          {!notification.read && (
                            <span className="h-2 w-2 rounded-full bg-primary flex-shrink-0 mt-2" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Nenhuma notificação</h3>
                <p className="text-muted-foreground">
                  {activeTab === "unread"
                    ? "Todas as notificações foram lidas"
                    : "Você não tem notificações ainda"}
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
