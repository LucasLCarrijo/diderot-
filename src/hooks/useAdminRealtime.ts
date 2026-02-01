import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { startOfDay, format, subMinutes } from "date-fns";

// Types - compatible with existing components
export type ConnectionStatus = "connecting" | "connected" | "syncing" | "disconnected";

export interface RealtimeEvent {
  id: string;
  type: "click" | "favorite" | "follow" | "signup" | "conversion" | "product" | "post" | "report";
  message: string;
  icon: string;
  user?: {
    name: string;
    avatar?: string;
  };
  resourceUrl?: string;
  timestamp: Date;
  isNew?: boolean;
}

export interface RealtimeMetrics {
  usersOnline: number;
  clicksPerMinute: number;
  liveConversions: number;
}

export interface RealtimeSettings {
  updateInterval: number;
  maxEvents: number;
  soundEnabled: boolean;
}

// Icon mapping for event types
const EVENT_ICONS: Record<RealtimeEvent["type"], string> = {
  click: "👆",
  favorite: "❤️",
  follow: "👥",
  signup: "🆕",
  conversion: "⭐",
  product: "📦",
  post: "📸",
  report: "🚨",
};

// Hook
export function useAdminRealtime() {
  const [status, setStatus] = useState<ConnectionStatus>("connecting");
  const [events, setEvents] = useState<RealtimeEvent[]>([]);
  const [metrics, setMetrics] = useState<RealtimeMetrics>({
    usersOnline: 0,
    clicksPerMinute: 0,
    liveConversions: 0,
  });
  const [clicksChartData, setClicksChartData] = useState<{ time: string; value: number }[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [settings, setSettings] = useState<RealtimeSettings>({
    updateInterval: 10000,
    maxEvents: 50,
    soundEnabled: false,
  });

  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Fetch initial metrics
  const fetchMetrics = useCallback(async () => {
    try {
      const now = new Date();
      const oneMinuteAgo = subMinutes(now, 1);
      const fiveMinutesAgo = subMinutes(now, 5);
      const todayStart = startOfDay(now);

      // Parallel queries for metrics
      const [clicksResult, onlineResult, conversionsResult] = await Promise.all([
        // Clicks in last minute
        supabase
          .from("clicks")
          .select("*", { count: "exact", head: true })
          .gte("created_at", oneMinuteAgo.toISOString()),
        
        // Active profiles (updated in last 5 minutes as proxy for "online")
        supabase
          .from("profiles")
          .select("*", { count: "exact", head: true })
          .gte("updated_at", fiveMinutesAgo.toISOString()),
        
        // Pro conversions today
        supabase
          .from("subscriptions")
          .select("*", { count: "exact", head: true })
          .gte("created_at", todayStart.toISOString())
          .eq("status", "active"),
      ]);

      setMetrics({
        clicksPerMinute: clicksResult.count || 0,
        usersOnline: onlineResult.count || 0,
        liveConversions: conversionsResult.count || 0,
      });
      setLastUpdate(new Date());
    } catch (error) {
      console.error("Error fetching realtime metrics:", error);
    }
  }, []);

  // Fetch clicks chart data (last 10 minutes aggregated by minute)
  const fetchClicksChartData = useCallback(async () => {
    try {
      const now = new Date();
      const tenMinutesAgo = subMinutes(now, 10);

      const { data: clicks } = await supabase
        .from("clicks")
        .select("created_at")
        .gte("created_at", tenMinutesAgo.toISOString())
        .order("created_at", { ascending: true });

      // Aggregate by minute
      const minuteMap = new Map<string, number>();
      
      // Initialize all 10 minutes with 0
      for (let i = 9; i >= 0; i--) {
        const minute = subMinutes(now, i);
        const key = format(minute, "HH:mm");
        minuteMap.set(key, 0);
      }

      // Count clicks per minute
      if (clicks) {
        clicks.forEach((click) => {
          const minute = format(new Date(click.created_at), "HH:mm");
          minuteMap.set(minute, (minuteMap.get(minute) || 0) + 1);
        });
      }

      // Convert to array
      const chartData = Array.from(minuteMap.entries()).map(([time, value]) => ({
        time,
        value,
      }));

      setClicksChartData(chartData);
    } catch (error) {
      console.error("Error fetching clicks chart data:", error);
    }
  }, []);

  // Add event to feed
  const addEvent = useCallback((event: Omit<RealtimeEvent, "id" | "icon"> & { type: RealtimeEvent["type"] }) => {
    if (isPaused) return;

    const newEvent: RealtimeEvent = {
      ...event,
      id: crypto.randomUUID(),
      icon: EVENT_ICONS[event.type],
      isNew: true,
    };

    setEvents((prev) => {
      const updated = [newEvent, ...prev].slice(0, settings.maxEvents);
      return updated;
    });

    setLastUpdate(new Date());

    // Remove isNew flag after animation
    setTimeout(() => {
      setEvents((prev) =>
        prev.map((e) => (e.id === newEvent.id ? { ...e, isNew: false } : e))
      );
    }, 2000);
  }, [isPaused, settings.maxEvents]);

  // Setup realtime subscriptions
  useEffect(() => {
    const channel = supabase
      .channel("admin-realtime-feed")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "clicks" },
        async (payload) => {
          // Fetch product info
          const { data: product } = await supabase
            .from("products")
            .select("title, slug")
            .eq("id", payload.new.product_id)
            .single();

          addEvent({
            type: "click",
            message: `Clique em "${product?.title || "produto"}"`,
            resourceUrl: product?.slug ? `/p/${product.slug}` : undefined,
            timestamp: new Date(),
          });

          // Refresh metrics
          fetchMetrics();
          fetchClicksChartData();
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "favorites" },
        async (payload) => {
          const { data } = await supabase
            .from("products")
            .select("title, slug")
            .eq("id", payload.new.product_id)
            .single();

          addEvent({
            type: "favorite",
            message: `Produto "${data?.title || ""}" favoritado`,
            resourceUrl: data?.slug ? `/p/${data.slug}` : undefined,
            timestamp: new Date(),
          });
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "follows" },
        async (payload) => {
          const { data: creator } = await supabase
            .from("profiles")
            .select("name, username")
            .eq("id", payload.new.creator_id)
            .single();

          addEvent({
            type: "follow",
            message: `Novo seguidor para @${creator?.username || "creator"}`,
            resourceUrl: creator?.username ? `/@${creator.username}` : undefined,
            timestamp: new Date(),
          });
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "profiles" },
        async (payload) => {
          addEvent({
            type: "signup",
            message: `Novo usuário: ${payload.new.name || payload.new.username}`,
            user: {
              name: payload.new.name || payload.new.username,
              avatar: payload.new.avatar_url,
            },
            resourceUrl: `/@${payload.new.username}`,
            timestamp: new Date(),
          });
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "subscriptions" },
        async (payload) => {
          if (payload.new.status === "active") {
            addEvent({
              type: "conversion",
              message: "Nova assinatura Creator Pro!",
              timestamp: new Date(),
            });
            fetchMetrics();
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "products" },
        async (payload) => {
          const { data: creator } = await supabase
            .from("profiles")
            .select("name, username")
            .eq("id", payload.new.creator_id)
            .single();

          addEvent({
            type: "product",
            message: `Novo produto: "${payload.new.title}" por @${creator?.username || "creator"}`,
            resourceUrl: payload.new.slug ? `/p/${payload.new.slug}` : undefined,
            timestamp: new Date(),
          });
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "posts" },
        async (payload) => {
          const { data: creator } = await supabase
            .from("profiles")
            .select("name, username")
            .eq("id", payload.new.creator_id)
            .single();

          addEvent({
            type: "post",
            message: `Novo post de @${creator?.username || "creator"}`,
            resourceUrl: `/posts/${payload.new.id}`,
            timestamp: new Date(),
          });
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "reports" },
        async (payload) => {
          addEvent({
            type: "report",
            message: `Novo report: ${payload.new.reason}`,
            resourceUrl: "/admin/moderation",
            timestamp: new Date(),
          });
        }
      )
      .subscribe((channelStatus) => {
        if (channelStatus === "SUBSCRIBED") {
          setStatus("connected");
        } else if (channelStatus === "CLOSED" || channelStatus === "CHANNEL_ERROR") {
          setStatus("disconnected");
        }
      });

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [addEvent, fetchMetrics, fetchClicksChartData]);

  // Fetch initial data and set up polling
  useEffect(() => {
    fetchMetrics();
    fetchClicksChartData();

    const interval = setInterval(() => {
      fetchMetrics();
      fetchClicksChartData();
    }, settings.updateInterval);

    setStatus("connected");

    return () => clearInterval(interval);
  }, [fetchMetrics, fetchClicksChartData, settings.updateInterval]);

  // Control functions
  const togglePause = useCallback(() => {
    setIsPaused((prev) => !prev);
  }, []);

  const clearEvents = useCallback(() => {
    setEvents([]);
  }, []);

  const updateSettings = useCallback((updates: Partial<RealtimeSettings>) => {
    setSettings((prev) => ({ ...prev, ...updates }));
  }, []);

  const markEventAsRead = useCallback((eventId: string) => {
    setEvents((prev) =>
      prev.map((e) => (e.id === eventId ? { ...e, isNew: false } : e))
    );
  }, []);

  const connect = useCallback(() => {
    setStatus("connecting");
    // Re-subscribe to channel
    if (channelRef.current) {
      channelRef.current.subscribe();
    }
  }, []);

  const disconnect = useCallback(() => {
    setStatus("disconnected");
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }
  }, []);

  return {
    status,
    events,
    metrics,
    clicksChartData,
    isPaused,
    lastUpdate,
    settings,
    togglePause,
    clearEvents,
    updateSettings,
    markEventAsRead,
    connect,
    disconnect,
  };
}
