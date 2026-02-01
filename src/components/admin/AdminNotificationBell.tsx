import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Bell,
  AlertTriangle,
  AlertCircle,
  Info,
  XCircle,
  X,
  CheckCheck,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  useAdminNotifications,
  NotificationType,
  AdminNotification,
} from "@/hooks/useAdminNotifications";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const typeConfig: Record<
  NotificationType,
  { icon: typeof AlertTriangle; color: string; bg: string; label: string }
> = {
  critical: {
    icon: XCircle,
    color: "text-red-500",
    bg: "bg-red-500/10",
    label: "Crítico",
  },
  urgent: {
    icon: AlertTriangle,
    color: "text-orange-500",
    bg: "bg-orange-500/10",
    label: "Urgente",
  },
  important: {
    icon: AlertCircle,
    color: "text-yellow-500",
    bg: "bg-yellow-500/10",
    label: "Importante",
  },
  info: {
    icon: Info,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
    label: "Info",
  },
};

interface NotificationItemProps {
  notification: AdminNotification;
  onMarkAsRead: (id: string) => void;
  onDismiss: (id: string) => void;
  onNavigate: (url: string) => void;
}

function NotificationItem({
  notification,
  onMarkAsRead,
  onDismiss,
  onNavigate,
}: NotificationItemProps) {
  const config = typeConfig[notification.type];
  const Icon = config.icon;

  const handleClick = () => {
    if (!notification.read) {
      onMarkAsRead(notification.id);
    }
    if (notification.actionUrl) {
      onNavigate(notification.actionUrl);
    }
  };

  return (
    <div
      className={cn(
        "p-3 border-b last:border-b-0 hover:bg-muted/50 transition-colors cursor-pointer relative group",
        !notification.read && "bg-muted/30"
      )}
      onClick={handleClick}
    >
      <div className="flex gap-3">
        <div className={cn("p-2 rounded-full shrink-0", config.bg)}>
          <Icon className={cn("h-4 w-4", config.color)} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <p className="font-medium text-sm truncate">{notification.title}</p>
              {!notification.read && (
                <Badge
                  variant="secondary"
                  className="text-[10px] px-1.5 py-0 bg-primary text-primary-foreground"
                >
                  Nova
                </Badge>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
              onClick={(e) => {
                e.stopPropagation();
                onDismiss(notification.id);
              }}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
            {notification.message}
          </p>
          <div className="flex items-center justify-between mt-2">
            <span className="text-[10px] text-muted-foreground">
              {formatDistanceToNow(new Date(notification.timestamp), {
                addSuffix: true,
                locale: ptBR,
              })}
            </span>
            {notification.actionLabel && (
              <Button
                variant="link"
                size="sm"
                className="h-auto p-0 text-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  handleClick();
                }}
              >
                {notification.actionLabel}
                <ExternalLink className="h-3 w-3 ml-1" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function AdminNotificationBell() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const {
    notifications,
    isLoading,
    unreadCount,
    markAsRead,
    markAllAsRead,
    dismissNotification,
  } = useAdminNotifications({ limit: 10 });

  const handleMarkAsRead = (id: string) => {
    markAsRead.mutate(id);
  };

  const handleDismiss = (id: string) => {
    dismissNotification.mutate(id);
    toast.success("Notificação removida");
  };

  const handleMarkAllAsRead = () => {
    markAllAsRead.mutate();
    toast.success("Todas as notificações marcadas como lidas");
  };

  const handleNavigate = (url: string) => {
    setOpen(false);
    navigate(url);
  };

  const handleViewAll = () => {
    setOpen(false);
    navigate("/admin/notifications");
  };

  // Get counts by type for the badge
  const criticalCount = notifications.filter(
    (n) => n.type === "critical" && !n.read
  ).length;
  const urgentCount = notifications.filter(
    (n) => n.type === "urgent" && !n.read
  ).length;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5 text-muted-foreground" />
          {unreadCount > 0 && (
            <span
              className={cn(
                "absolute -top-0.5 -right-0.5 h-5 w-5 flex items-center justify-center text-[10px] font-bold rounded-full text-white",
                criticalCount > 0
                  ? "bg-red-500"
                  : urgentCount > 0
                  ? "bg-orange-500"
                  : "bg-admin-warning"
              )}
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        {/* Header */}
        <div className="p-4 border-b flex items-center justify-between">
          <div>
            <h4 className="font-semibold">Notificações</h4>
            <p className="text-xs text-muted-foreground">
              {unreadCount > 0 ? `${unreadCount} não lidas` : "Todas lidas"}
            </p>
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllAsRead}
              disabled={markAllAsRead.isPending}
            >
              <CheckCheck className="h-4 w-4 mr-1" />
              Marcar Todas
            </Button>
          )}
        </div>

        {/* Notification List */}
        <ScrollArea className="h-[400px]">
          {isLoading ? (
            <div className="p-4 space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center">
              <Bell className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-sm text-muted-foreground">
                Nenhuma notificação
              </p>
            </div>
          ) : (
            notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkAsRead={handleMarkAsRead}
                onDismiss={handleDismiss}
                onNavigate={handleNavigate}
              />
            ))
          )}
        </ScrollArea>

        {/* Footer */}
        <Separator />
        <div className="p-2">
          <Button variant="ghost" className="w-full" onClick={handleViewAll}>
            Ver Todas as Notificações
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
