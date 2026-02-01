import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type NotificationType = "critical" | "urgent" | "important" | "info";

export interface AdminNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actionUrl?: string;
  actionLabel?: string;
  metadata?: Record<string, unknown>;
}

// Map database notification types to admin notification types
const mapNotificationType = (dbType: string): NotificationType => {
  const typeMap: Record<string, NotificationType> = {
    follow: "info",
    favorite: "info",
    click: "info",
    comment: "info",
    campaign: "important",
    system: "critical",
    alert: "critical",
    warning: "urgent",
    success: "info",
    info: "info",
  };
  return typeMap[dbType] || "info";
};

export function useAdminNotifications(options?: { limit?: number }) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["admin-notifications", options?.limit],
    queryFn: async () => {
      // Fetch real notifications from the database
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(options?.limit || 50);
      
      if (error) {
        console.error("Error fetching admin notifications:", error);
        return [];
      }
      
      // Transform to AdminNotification format
      return (data || []).map((n): AdminNotification => ({
        id: n.id,
        type: mapNotificationType(n.type),
        title: n.title,
        message: n.message,
        timestamp: n.created_at,
        read: n.read,
        actionUrl: n.action_url || undefined,
      }));
    },
    refetchInterval: 30000, // Poll every 30 seconds
  });

  const unreadCount = query.data?.filter((n) => !n.read).length || 0;

  const markAsRead = useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from("notifications")
        .update({ read: true })
        .eq("id", notificationId);
      
      if (error) throw error;
      return notificationId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-notifications"] });
    },
  });

  const markAllAsRead = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("notifications")
        .update({ read: true })
        .eq("read", false);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-notifications"] });
    },
  });

  const dismissNotification = useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from("notifications")
        .delete()
        .eq("id", notificationId);
      
      if (error) throw error;
      return notificationId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-notifications"] });
    },
  });

  return {
    notifications: query.data || [],
    isLoading: query.isLoading,
    unreadCount,
    markAsRead,
    markAllAsRead,
    dismissNotification,
    refetch: query.refetch,
  };
}

export function useAdminNotificationStats() {
  const { notifications } = useAdminNotifications();

  const stats = {
    critical: notifications.filter((n) => n.type === "critical" && !n.read).length,
    urgent: notifications.filter((n) => n.type === "urgent" && !n.read).length,
    important: notifications.filter((n) => n.type === "important" && !n.read).length,
    info: notifications.filter((n) => n.type === "info" && !n.read).length,
    total: notifications.filter((n) => !n.read).length,
  };

  return stats;
}

// Notification preferences hook
export interface NotificationPreferences {
  critical: { inApp: boolean; email: boolean; push: boolean };
  urgent: { inApp: boolean; email: boolean; push: boolean };
  important: { inApp: boolean; email: boolean; push: boolean };
  info: { inApp: boolean; email: boolean; push: boolean };
  alertEmail: string;
  quietHoursStart: string;
  quietHoursEnd: string;
  digestFrequency: "never" | "daily" | "weekly";
}

const defaultPreferences: NotificationPreferences = {
  critical: { inApp: true, email: true, push: true },
  urgent: { inApp: true, email: true, push: false },
  important: { inApp: true, email: false, push: false },
  info: { inApp: true, email: false, push: false },
  alertEmail: "",
  quietHoursStart: "22:00",
  quietHoursEnd: "08:00",
  digestFrequency: "daily",
};

export function useNotificationPreferences() {
  const [preferences, setPreferences] = useState<NotificationPreferences>(() => {
    const saved = localStorage.getItem("admin-notification-preferences");
    return saved ? JSON.parse(saved) : defaultPreferences;
  });

  const updatePreferences = useCallback((updates: Partial<NotificationPreferences>) => {
    setPreferences((prev) => {
      const newPrefs = { ...prev, ...updates };
      localStorage.setItem("admin-notification-preferences", JSON.stringify(newPrefs));
      return newPrefs;
    });
  }, []);

  const resetPreferences = useCallback(() => {
    setPreferences(defaultPreferences);
    localStorage.setItem("admin-notification-preferences", JSON.stringify(defaultPreferences));
  }, []);

  return { preferences, updatePreferences, resetPreferences };
}

// Custom alerts hook
export interface CustomAlert {
  id: string;
  name: string;
  metric: string;
  operator: ">" | "<" | "=" | ">=" | "<=";
  value: number;
  frequency: "hourly" | "daily";
  action: "notify" | "notify_email";
  recipients: string[];
  active: boolean;
  createdAt: string;
}

export function useCustomAlerts() {
  const [alerts, setAlerts] = useState<CustomAlert[]>([]);

  const addAlert = useCallback((alert: Omit<CustomAlert, "id" | "createdAt">) => {
    const newAlert: CustomAlert = {
      ...alert,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    setAlerts((prev) => [...prev, newAlert]);
    return newAlert;
  }, []);

  const updateAlert = useCallback((id: string, updates: Partial<CustomAlert>) => {
    setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, ...updates } : a)));
  }, []);

  const deleteAlert = useCallback((id: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const toggleAlert = useCallback((id: string) => {
    setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, active: !a.active } : a)));
  }, []);

  return { alerts, addAlert, updateAlert, deleteAlert, toggleAlert };
}
