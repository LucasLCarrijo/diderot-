import { useState, useEffect, useCallback, useRef } from "react";

export type ConnectionStatus = "connected" | "connecting" | "disconnected" | "syncing";

export interface RealtimeEvent {
  id: string;
  type: "new_click" | "new_user" | "new_favorite" | "new_follower" | "new_pro" | "new_product" | "new_post" | "report" | "critical_alert";
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
  recentClicks: { time: string; value: number }[];
  liveConversions: number;
}

export interface RealtimeSettings {
  enabled: boolean;
  updateInterval: number; // in seconds
  soundEnabled: boolean;
  showActivityFeed: boolean;
}

const DEFAULT_SETTINGS: RealtimeSettings = {
  enabled: true,
  updateInterval: 10,
  soundEnabled: false,
  showActivityFeed: true,
};

// Mock event generators
const generateMockEvent = (): RealtimeEvent => {
  const eventTypes: RealtimeEvent["type"][] = [
    "new_click", "new_user", "new_favorite", "new_follower", 
    "new_pro", "new_product", "new_post", "report"
  ];
  const type = eventTypes[Math.floor(Math.random() * eventTypes.length)];
  
  const names = ["João Silva", "Maria Santos", "Ana Costa", "Pedro Oliveira", "Carla Lima", "Lucas Ferreira", "Julia Martins"];
  const products = ["iPhone 15 Pro", "Nike Air Max", "MacBook Pro", "Smartwatch X", "Fone Bluetooth", "Tênis Adidas"];
  const name = names[Math.floor(Math.random() * names.length)];
  const product = products[Math.floor(Math.random() * products.length)];

  const templates: Record<RealtimeEvent["type"], { icon: string; message: string }> = {
    new_click: { icon: "👆", message: `Clique em "${product}"` },
    new_user: { icon: "🆕", message: `${name} criou uma conta` },
    new_favorite: { icon: "❤️", message: `${name} favoritou "${product}"` },
    new_follower: { icon: "👥", message: `${name} ganhou um novo follower` },
    new_pro: { icon: "💰", message: `Nova assinatura Pro: ${name} (R$ 49,90)` },
    new_product: { icon: "📦", message: `${name} criou um produto: "${product}"` },
    new_post: { icon: "📸", message: `Novo post publicado por ${name}` },
    report: { icon: "🚨", message: `Produto reportado: "${product}"` },
    critical_alert: { icon: "⚠️", message: "Alerta crítico do sistema" },
  };

  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    type,
    ...templates[type],
    user: { name, avatar: `https://i.pravatar.cc/40?u=${name}` },
    resourceUrl: type === "new_product" ? `/p/${product.toLowerCase().replace(/ /g, "-")}` : undefined,
    timestamp: new Date(),
    isNew: true,
  };
};

export function useRealtimeConnection() {
  const [status, setStatus] = useState<ConnectionStatus>("connecting");
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [events, setEvents] = useState<RealtimeEvent[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const [metrics, setMetrics] = useState<RealtimeMetrics>({
    usersOnline: 127,
    clicksPerMinute: 23,
    recentClicks: Array.from({ length: 10 }, (_, i) => ({
      time: `${i}m`,
      value: Math.floor(Math.random() * 30) + 10,
    })),
    liveConversions: 0,
  });
  const [settings, setSettings] = useState<RealtimeSettings>(() => {
    const saved = localStorage.getItem("realtime-settings");
    return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
  });

  const eventIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const metricsIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Save settings to localStorage
  useEffect(() => {
    localStorage.setItem("realtime-settings", JSON.stringify(settings));
  }, [settings]);

  // Simulate WebSocket connection
  const connect = useCallback(() => {
    setStatus("connecting");
    
    // Simulate connection delay
    setTimeout(() => {
      setStatus("connected");
      setLastUpdate(new Date());
    }, 1000);
  }, []);

  const disconnect = useCallback(() => {
    setStatus("disconnected");
    if (eventIntervalRef.current) clearInterval(eventIntervalRef.current);
    if (metricsIntervalRef.current) clearInterval(metricsIntervalRef.current);
  }, []);

  // Simulate receiving events
  useEffect(() => {
    if (!settings.enabled || isPaused || status !== "connected") {
      if (eventIntervalRef.current) clearInterval(eventIntervalRef.current);
      return;
    }

    eventIntervalRef.current = setInterval(() => {
      const newEvent = generateMockEvent();
      setEvents((prev) => [newEvent, ...prev.slice(0, 49)]); // Keep last 50 events
      setLastUpdate(new Date());

      // Handle Pro conversion animation
      if (newEvent.type === "new_pro") {
        setMetrics((prev) => ({
          ...prev,
          liveConversions: prev.liveConversions + 1,
        }));
      }

      // Play sound for critical events
      if (settings.soundEnabled && newEvent.type === "critical_alert") {
        // In a real app, play notification sound
        console.log("🔔 Sound notification for critical alert");
      }
    }, 3000 + Math.random() * 4000); // Random interval 3-7 seconds

    return () => {
      if (eventIntervalRef.current) clearInterval(eventIntervalRef.current);
    };
  }, [settings.enabled, settings.soundEnabled, isPaused, status]);

  // Simulate metrics updates
  useEffect(() => {
    if (!settings.enabled || status !== "connected") {
      if (metricsIntervalRef.current) clearInterval(metricsIntervalRef.current);
      return;
    }

    metricsIntervalRef.current = setInterval(() => {
      setMetrics((prev) => {
        const newClick = Math.floor(Math.random() * 30) + 10;
        return {
          usersOnline: Math.max(50, prev.usersOnline + Math.floor((Math.random() - 0.5) * 10)),
          clicksPerMinute: newClick,
          recentClicks: [...prev.recentClicks.slice(1), { time: "now", value: newClick }],
          liveConversions: prev.liveConversions,
        };
      });
      setLastUpdate(new Date());
    }, settings.updateInterval * 1000);

    return () => {
      if (metricsIntervalRef.current) clearInterval(metricsIntervalRef.current);
    };
  }, [settings.enabled, settings.updateInterval, status]);

  // Initial connection
  useEffect(() => {
    if (settings.enabled) {
      connect();
    }
    return () => disconnect();
  }, [settings.enabled, connect, disconnect]);

  // Simulate connection loss and recovery
  useEffect(() => {
    if (!settings.enabled) return;

    const simulateConnectionIssue = () => {
      const randomDelay = 30000 + Math.random() * 60000; // 30-90 seconds
      reconnectTimeoutRef.current = setTimeout(() => {
        // 10% chance of "disconnection"
        if (Math.random() < 0.1) {
          setStatus("syncing");
          setTimeout(() => {
            setStatus("connected");
            setLastUpdate(new Date());
          }, 2000);
        }
        simulateConnectionIssue();
      }, randomDelay);
    };

    simulateConnectionIssue();

    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
    };
  }, [settings.enabled]);

  const updateSettings = useCallback((newSettings: Partial<RealtimeSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  }, []);

  const togglePause = useCallback(() => {
    setIsPaused((prev) => !prev);
  }, []);

  const clearEvents = useCallback(() => {
    setEvents([]);
  }, []);

  const markEventAsRead = useCallback((eventId: string) => {
    setEvents((prev) =>
      prev.map((e) => (e.id === eventId ? { ...e, isNew: false } : e))
    );
  }, []);

  const resetConversions = useCallback(() => {
    setMetrics((prev) => ({ ...prev, liveConversions: 0 }));
  }, []);

  return {
    status,
    lastUpdate,
    events,
    metrics,
    settings,
    isPaused,
    connect,
    disconnect,
    updateSettings,
    togglePause,
    clearEvents,
    markEventAsRead,
    resetConversions,
  };
}
