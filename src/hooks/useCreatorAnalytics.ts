import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format, eachDayOfInterval, startOfDay } from "date-fns";

export interface DateRange {
  from: Date;
  to: Date;
}

export interface ClickData {
  date: string;
  clicks: number;
}

export interface ProductStats {
  id: string;
  title: string;
  image_url: string | null;
  click_count: number;
  favorite_count: number;
}

export interface DeviceStats {
  device: string;
  count: number;
}

export interface UTMStats {
  source: string;
  count: number;
}

async function getProfileId(userId: string): Promise<string | null> {
  const { data } = await supabase
    .from("profiles")
    .select("id")
    .eq("user_id", userId)
    .single();
  return data?.id || null;
}

export function useCreatorAnalytics(dateRange: DateRange) {
  const { user } = useAuth();
  
  // Get total clicks
  const { data: totalClicks = 0, isLoading: loadingTotal } = useQuery({
    queryKey: ["creator-analytics-total", user?.id, dateRange],
    queryFn: async () => {
      if (!user?.id) return 0;
      
      const profileId = await getProfileId(user.id);
      if (!profileId) return 0;
      
      // Get all product IDs for this creator
      const { data: products } = await supabase
        .from("products")
        .select("id")
        .eq("creator_id", profileId);
      
      if (!products?.length) return 0;
      
      const productIds = products.map(p => p.id);
      
      const { count } = await supabase
        .from("clicks")
        .select("*", { count: "exact", head: true })
        .in("product_id", productIds)
        .gte("created_at", dateRange.from.toISOString())
        .lte("created_at", dateRange.to.toISOString());
      
      return count || 0;
    },
    enabled: !!user?.id,
  });
  
  // Get clicks over time
  const { data: clicksOverTime = [], isLoading: loadingOverTime } = useQuery({
    queryKey: ["creator-analytics-over-time", user?.id, dateRange],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const profileId = await getProfileId(user.id);
      if (!profileId) return [];
      
      const { data: products } = await supabase
        .from("products")
        .select("id")
        .eq("creator_id", profileId);
      
      if (!products?.length) return [];
      
      const productIds = products.map(p => p.id);
      
      const { data: clicks } = await supabase
        .from("clicks")
        .select("created_at")
        .in("product_id", productIds)
        .gte("created_at", dateRange.from.toISOString())
        .lte("created_at", dateRange.to.toISOString());
      
      // Group by day
      const days = eachDayOfInterval({ start: dateRange.from, end: dateRange.to });
      const clicksByDay: Record<string, number> = {};
      
      days.forEach(day => {
        clicksByDay[format(day, "yyyy-MM-dd")] = 0;
      });
      
      clicks?.forEach(click => {
        const day = format(new Date(click.created_at), "yyyy-MM-dd");
        if (clicksByDay[day] !== undefined) {
          clicksByDay[day]++;
        }
      });
      
      return Object.entries(clicksByDay).map(([date, clicks]) => ({
        date,
        clicks,
      }));
    },
    enabled: !!user?.id,
  });
  
  // Get top products
  const { data: topProducts = [], isLoading: loadingProducts } = useQuery({
    queryKey: ["creator-analytics-products", user?.id, dateRange],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const profileId = await getProfileId(user.id);
      if (!profileId) return [];
      
      const { data: products } = await supabase
        .from("products")
        .select("id, title, image_url, click_count, favorite_count")
        .eq("creator_id", profileId)
        .eq("status", "published")
        .order("click_count", { ascending: false })
        .limit(10);
      
      return products || [];
    },
    enabled: !!user?.id,
  });
  
  // Get device breakdown
  const { data: deviceStats = [], isLoading: loadingDevices } = useQuery({
    queryKey: ["creator-analytics-devices", user?.id, dateRange],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const profileId = await getProfileId(user.id);
      if (!profileId) return [];
      
      const { data: products } = await supabase
        .from("products")
        .select("id")
        .eq("creator_id", profileId);
      
      if (!products?.length) return [];
      
      const productIds = products.map(p => p.id);
      
      const { data: clicks } = await supabase
        .from("clicks")
        .select("device")
        .in("product_id", productIds)
        .gte("created_at", dateRange.from.toISOString())
        .lte("created_at", dateRange.to.toISOString());
      
      const deviceCounts: Record<string, number> = {};
      clicks?.forEach(click => {
        const device = click.device || "unknown";
        deviceCounts[device] = (deviceCounts[device] || 0) + 1;
      });
      
      return Object.entries(deviceCounts).map(([device, count]) => ({
        device,
        count,
      }));
    },
    enabled: !!user?.id,
  });
  
  // Get UTM source breakdown
  const { data: utmStats = [], isLoading: loadingUTM } = useQuery({
    queryKey: ["creator-analytics-utm", user?.id, dateRange],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const profileId = await getProfileId(user.id);
      if (!profileId) return [];
      
      const { data: products } = await supabase
        .from("products")
        .select("id")
        .eq("creator_id", profileId);
      
      if (!products?.length) return [];
      
      const productIds = products.map(p => p.id);
      
      const { data: clicks } = await supabase
        .from("clicks")
        .select("utm_source")
        .in("product_id", productIds)
        .gte("created_at", dateRange.from.toISOString())
        .lte("created_at", dateRange.to.toISOString())
        .not("utm_source", "is", null);
      
      const sourceCounts: Record<string, number> = {};
      clicks?.forEach(click => {
        const source = click.utm_source || "direto";
        sourceCounts[source] = (sourceCounts[source] || 0) + 1;
      });
      
      return Object.entries(sourceCounts)
        .map(([source, count]) => ({ source, count }))
        .sort((a, b) => b.count - a.count);
    },
    enabled: !!user?.id,
  });
  
  const isLoading = loadingTotal || loadingOverTime || loadingProducts || loadingDevices || loadingUTM;
  
  return {
    totalClicks,
    clicksOverTime,
    topProducts,
    deviceStats,
    utmStats,
    isLoading,
  };
}
