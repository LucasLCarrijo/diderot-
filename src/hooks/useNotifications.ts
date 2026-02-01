import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface Notification {
  id: string;
  user_id: string;
  type: "follow" | "favorite" | "click" | "comment";
  title: string;
  message: string;
  action_url: string | null;
  read: boolean;
  actor_id: string | null;
  resource_id: string | null;
  created_at: string;
  actor?: {
    id: string;
    username: string;
    name: string;
    avatar_url: string | null;
  };
}

export function useNotifications(limit?: number) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["notifications", user?.id, limit],
    queryFn: async () => {
      let query = supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });

      if (limit) {
        query = query.limit(limit);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Fetch actor profiles separately
      const actorIds = [...new Set(data?.filter(n => n.actor_id).map(n => n.actor_id) || [])];
      let actorMap: Record<string, any> = {};
      
      if (actorIds.length > 0) {
        // Select only public fields for actor profiles
        const { data: actors } = await supabase
          .from("profiles")
          .select("id, username, name, avatar_url")
          .in("id", actorIds);
        
        actorMap = (actors || []).reduce((acc, actor) => {
          acc[actor.id] = actor;
          return acc;
        }, {} as Record<string, any>);
      }

      return (data || []).map(n => ({
        ...n,
        actor: n.actor_id ? actorMap[n.actor_id] : undefined
      })) as Notification[];
    },
    enabled: !!user?.id,
  });
}

export function useUnreadCount() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["notifications-unread-count", user?.id],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user!.id)
        .eq("read", false);

      if (error) throw error;
      return count || 0;
    },
    enabled: !!user?.id,
    refetchInterval: 30000, // Refetch every 30 seconds
  });
}

export function useMarkAsRead() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from("notifications")
        .update({ read: true })
        .eq("id", notificationId)
        .eq("user_id", user!.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notifications-unread-count"] });
    },
  });
}

export function useMarkAllAsRead() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("notifications")
        .update({ read: true })
        .eq("user_id", user!.id)
        .eq("read", false);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notifications-unread-count"] });
    },
  });
}

export function useDeleteNotification() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from("notifications")
        .delete()
        .eq("id", notificationId)
        .eq("user_id", user!.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notifications-unread-count"] });
    },
  });
}

export function useClearAllNotifications() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("notifications")
        .delete()
        .eq("user_id", user!.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notifications-unread-count"] });
    },
  });
}
