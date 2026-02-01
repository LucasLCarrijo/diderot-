import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow, format, isToday, isYesterday, isThisWeek } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar } from "@/components/ui/calendar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Bell,
  AlertTriangle,
  AlertCircle,
  Info,
  XCircle,
  X,
  CheckCheck,
  ExternalLink,
  Filter,
  CalendarIcon,
  Trash2,
  CheckSquare,
} from "lucide-react";
import {
  useAdminNotifications,
  NotificationType,
  AdminNotification,
} from "@/hooks/useAdminNotifications";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const typeConfig: Record<
  NotificationType,
  { icon: typeof AlertTriangle; color: string; bg: string; label: string; badgeClass: string }
> = {
  critical: {
    icon: XCircle,
    color: "text-red-500",
    bg: "bg-red-500/10",
    label: "Crítico",
    badgeClass: "bg-red-500 text-white",
  },
  urgent: {
    icon: AlertTriangle,
    color: "text-orange-500",
    bg: "bg-orange-500/10",
    label: "Urgente",
    badgeClass: "bg-orange-500 text-white",
  },
  important: {
    icon: AlertCircle,
    color: "text-yellow-500",
    bg: "bg-yellow-500/10",
    label: "Importante",
    badgeClass: "bg-yellow-500 text-white",
  },
  info: {
    icon: Info,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
    label: "Info",
    badgeClass: "bg-blue-500 text-white",
  },
};

export default function AdminNotifications() {
  const navigate = useNavigate();
  const {
    notifications,
    isLoading,
    unreadCount,
    markAsRead,
    markAllAsRead,
    dismissNotification,
  } = useAdminNotifications();

  const [statusFilter, setStatusFilter] = useState<"all" | "unread" | "read">("all");
  const [typeFilter, setTypeFilter] = useState<"all" | NotificationType>("all");
  const [dateFilter, setDateFilter] = useState<"all" | "today" | "week" | "month" | "custom">("all");
  const [customDate, setCustomDate] = useState<Date>();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Filter notifications
  const filteredNotifications = useMemo(() => {
    return notifications.filter((n) => {
      // Status filter
      if (statusFilter === "unread" && n.read) return false;
      if (statusFilter === "read" && !n.read) return false;

      // Type filter
      if (typeFilter !== "all" && n.type !== typeFilter) return false;

      // Date filter
      const date = new Date(n.timestamp);
      if (dateFilter === "today" && !isToday(date)) return false;
      if (dateFilter === "week" && !isThisWeek(date)) return false;
      if (dateFilter === "month") {
        const now = new Date();
        const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        if (date < oneMonthAgo) return false;
      }
      if (dateFilter === "custom" && customDate) {
        const filterStart = new Date(customDate);
        filterStart.setHours(0, 0, 0, 0);
        const filterEnd = new Date(customDate);
        filterEnd.setHours(23, 59, 59, 999);
        if (date < filterStart || date > filterEnd) return false;
      }

      return true;
    });
  }, [notifications, statusFilter, typeFilter, dateFilter, customDate]);

  // Group notifications by date
  const groupedNotifications = useMemo(() => {
    const groups: Record<string, AdminNotification[]> = {};
    
    filteredNotifications.forEach((n) => {
      const date = new Date(n.timestamp);
      let groupKey: string;
      
      if (isToday(date)) {
        groupKey = "Hoje";
      } else if (isYesterday(date)) {
        groupKey = "Ontem";
      } else if (isThisWeek(date)) {
        groupKey = "Esta Semana";
      } else {
        groupKey = "Mais Antigas";
      }
      
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(n);
    });
    
    return groups;
  }, [filteredNotifications]);

  const handleToggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedIds.size === filteredNotifications.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredNotifications.map((n) => n.id)));
    }
  };

  const handleMarkSelectedAsRead = () => {
    selectedIds.forEach((id) => {
      const n = notifications.find((n) => n.id === id);
      if (n && !n.read) {
        markAsRead.mutate(id);
      }
    });
    setSelectedIds(new Set());
    toast.success("Notificações marcadas como lidas");
  };

  const handleNotificationClick = (notification: AdminNotification) => {
    if (!notification.read) {
      markAsRead.mutate(notification.id);
    }
    if (notification.actionUrl) {
      navigate(notification.actionUrl);
    }
  };

  const handleDismiss = (id: string) => {
    dismissNotification.mutate(id);
    toast.success("Notificação removida");
  };

  return (
    <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Bell className="h-6 w-6" />
              Notificações
            </h1>
            <p className="text-muted-foreground">
              {unreadCount > 0 ? `${unreadCount} não lidas` : "Todas as notificações lidas"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Button
                variant="outline"
                onClick={() => {
                  markAllAsRead.mutate();
                  toast.success("Todas marcadas como lidas");
                }}
                disabled={markAllAsRead.isPending}
              >
                <CheckCheck className="h-4 w-4 mr-2" />
                Marcar Todas como Lidas
              </Button>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {(["critical", "urgent", "important", "info"] as NotificationType[]).map((type) => {
            const config = typeConfig[type];
            const count = notifications.filter((n) => n.type === type && !n.read).length;
            const Icon = config.icon;
            return (
              <Card
                key={type}
                className={cn(
                  "cursor-pointer transition-all hover:shadow-md",
                  typeFilter === type && "ring-2 ring-primary"
                )}
                onClick={() => setTypeFilter(typeFilter === type ? "all" : type)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={cn("p-2 rounded-full", config.bg)}>
                      <Icon className={cn("h-5 w-5", config.color)} />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{count}</p>
                      <p className="text-xs text-muted-foreground">{config.label}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Filtros:</span>
              </div>

              <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="unread">Não Lidas</SelectItem>
                  <SelectItem value="read">Lidas</SelectItem>
                </SelectContent>
              </Select>

              <Select value={typeFilter} onValueChange={(v: any) => setTypeFilter(v)}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="critical">Críticas</SelectItem>
                  <SelectItem value="urgent">Urgentes</SelectItem>
                  <SelectItem value="important">Importantes</SelectItem>
                  <SelectItem value="info">Informativas</SelectItem>
                </SelectContent>
              </Select>

              <Select value={dateFilter} onValueChange={(v: any) => setDateFilter(v)}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Data" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as Datas</SelectItem>
                  <SelectItem value="today">Hoje</SelectItem>
                  <SelectItem value="week">Última Semana</SelectItem>
                  <SelectItem value="month">Último Mês</SelectItem>
                  <SelectItem value="custom">Customizado</SelectItem>
                </SelectContent>
              </Select>

              {dateFilter === "custom" && (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-[200px] justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {customDate ? format(customDate, "PPP", { locale: ptBR }) : "Selecionar data"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={customDate}
                      onSelect={setCustomDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              )}

              {(statusFilter !== "all" || typeFilter !== "all" || dateFilter !== "all") && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setStatusFilter("all");
                    setTypeFilter("all");
                    setDateFilter("all");
                    setCustomDate(undefined);
                  }}
                >
                  Limpar Filtros
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Bulk Actions */}
        {selectedIds.size > 0 && (
          <Card className="border-primary">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  {selectedIds.size} notificações selecionadas
                </span>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={handleMarkSelectedAsRead}>
                    <CheckCheck className="h-4 w-4 mr-1" />
                    Marcar como Lidas
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      selectedIds.forEach((id) => dismissNotification.mutate(id));
                      setSelectedIds(new Set());
                      toast.success("Notificações removidas");
                    }}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Remover
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Notifications List */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">
                {filteredNotifications.length} Notificações
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={handleSelectAll}>
                <CheckSquare className="h-4 w-4 mr-1" />
                {selectedIds.size === filteredNotifications.length ? "Desmarcar" : "Selecionar"} Todas
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-4 space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex gap-3 p-3">
                    <Skeleton className="h-10 w-10 rounded-full shrink-0" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-full" />
                      <Skeleton className="h-3 w-1/4" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="p-12 text-center">
                <Bell className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
                <h3 className="font-medium text-lg mb-1">Nenhuma notificação</h3>
                <p className="text-sm text-muted-foreground">
                  {statusFilter !== "all" || typeFilter !== "all" || dateFilter !== "all"
                    ? "Tente ajustar os filtros"
                    : "Você não tem notificações no momento"}
                </p>
              </div>
            ) : (
              Object.entries(groupedNotifications).map(([group, groupNotifications]) => (
                <div key={group}>
                  <div className="px-4 py-2 bg-muted/50 border-y">
                    <span className="text-sm font-medium text-muted-foreground">{group}</span>
                  </div>
                  {groupNotifications.map((notification) => {
                    const config = typeConfig[notification.type];
                    const Icon = config.icon;
                    const isSelected = selectedIds.has(notification.id);

                    return (
                      <div
                        key={notification.id}
                        className={cn(
                          "flex items-start gap-3 p-4 border-b last:border-b-0 hover:bg-muted/30 transition-colors cursor-pointer",
                          !notification.read && "bg-muted/20",
                          isSelected && "bg-primary/5"
                        )}
                        onClick={() => handleNotificationClick(notification)}
                      >
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => handleToggleSelect(notification.id)}
                          onClick={(e) => e.stopPropagation()}
                          className="mt-1"
                        />
                        <div className={cn("p-2 rounded-full shrink-0", config.bg)}>
                          <Icon className={cn("h-4 w-4", config.color)} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-medium">{notification.title}</p>
                              <Badge className={cn("text-[10px]", config.badgeClass)}>
                                {config.label}
                              </Badge>
                              {!notification.read && (
                                <Badge
                                  variant="secondary"
                                  className="text-[10px] bg-primary text-primary-foreground"
                                >
                                  Nova
                                </Badge>
                              )}
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 shrink-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDismiss(notification.id);
                              }}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {notification.message}
                          </p>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(notification.timestamp), "PPp", { locale: ptBR })}
                            </span>
                            {notification.actionLabel && notification.actionUrl && (
                              <Button
                                variant="link"
                                size="sm"
                                className="h-auto p-0 text-xs"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleNotificationClick(notification);
                                }}
                              >
                                {notification.actionLabel}
                                <ExternalLink className="h-3 w-3 ml-1" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))
            )}
        </CardContent>
        </Card>
      </div>
  );
}
