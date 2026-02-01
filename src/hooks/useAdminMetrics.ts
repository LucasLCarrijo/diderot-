import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { subDays, startOfDay, endOfDay, format } from "date-fns";

export type Period = "7d" | "30d" | "90d" | "1y" | "custom";

interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

// Helper to get date range based on period
export function getDateRange(period: Period, customRange?: DateRange): { start: Date; end: Date } {
  const now = new Date();
  const end = endOfDay(now);
  
  if (period === "custom" && customRange?.from && customRange?.to) {
    return { start: startOfDay(customRange.from), end: endOfDay(customRange.to) };
  }
  
  const days = period === "7d" ? 7 : period === "30d" ? 30 : period === "90d" ? 90 : 365;
  return { start: startOfDay(subDays(now, days)), end };
}

// Helper to get previous period date range for comparison
export function getPreviousPeriodRange(period: Period, customRange?: DateRange): { start: Date; end: Date } {
  const { start: currentStart, end: currentEnd } = getDateRange(period, customRange);
  const duration = currentEnd.getTime() - currentStart.getTime();
  const previousEnd = new Date(currentStart.getTime() - 1); // 1ms before current start
  const previousStart = new Date(previousEnd.getTime() - duration);
  return { start: previousStart, end: previousEnd };
}

// ==================== User Metrics ====================

export interface UserMetrics {
  totalUsers: number;
  totalCreators: number;
  totalFollowers: number;
  totalBrands: number;
  newUsersInPeriod: number;
  previousPeriodUsers: number;
  newUsersToday: number;
  newUsersThisWeek: number;
  newUsersThisMonth: number;
}

export function useUserMetrics(period: Period = "30d", customRange?: DateRange) {
  return useQuery({
    queryKey: ["admin-user-metrics", period, customRange?.from?.toISOString(), customRange?.to?.toISOString()],
    queryFn: async (): Promise<UserMetrics> => {
      const { start, end } = getDateRange(period, customRange);
      const { start: prevStart, end: prevEnd } = getPreviousPeriodRange(period, customRange);
      
      const now = new Date();
      const todayStart = startOfDay(now).toISOString();
      const weekStart = startOfDay(subDays(now, 7)).toISOString();
      const monthStart = startOfDay(subDays(now, 30)).toISOString();

      // Get total profiles
      const { count: totalUsers } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });

      // Get creators (profiles with products)
      const { data: creatorsData } = await supabase
        .from("products")
        .select("creator_id")
        .limit(10000);
      
      const uniqueCreators = new Set(creatorsData?.map(p => p.creator_id) || []);
      const totalCreators = uniqueCreators.size;

      // Get brands
      const { count: totalBrands } = await supabase
        .from("brands")
        .select("*", { count: "exact", head: true });

      // Get new users in selected period
      const { count: newUsersInPeriod } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .gte("created_at", start.toISOString())
        .lte("created_at", end.toISOString());

      // Get users in previous period for comparison
      const { count: previousPeriodUsers } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .gte("created_at", prevStart.toISOString())
        .lte("created_at", prevEnd.toISOString());

      // Get new users today
      const { count: newUsersToday } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .gte("created_at", todayStart);

      // Get new users this week
      const { count: newUsersThisWeek } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .gte("created_at", weekStart);

      // Get new users this month
      const { count: newUsersThisMonth } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .gte("created_at", monthStart);

      return {
        totalUsers: totalUsers || 0,
        totalCreators,
        totalFollowers: (totalUsers || 0) - totalCreators - (totalBrands || 0),
        totalBrands: totalBrands || 0,
        newUsersInPeriod: newUsersInPeriod || 0,
        previousPeriodUsers: previousPeriodUsers || 0,
        newUsersToday: newUsersToday || 0,
        newUsersThisWeek: newUsersThisWeek || 0,
        newUsersThisMonth: newUsersThisMonth || 0,
      };
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchInterval: 1000 * 60 * 5, // Refetch every 5 minutes
  });
}

// ==================== Content Metrics ====================

export interface ContentMetrics {
  totalProducts: number;
  totalPosts: number;
  totalCollections: number;
  productsInPeriod: number;
  postsInPeriod: number;
  previousPeriodProducts: number;
  previousPeriodPosts: number;
  productsThisWeek: number;
  postsThisWeek: number;
  publishedProducts: number;
  draftProducts: number;
}

export function useContentMetrics(period: Period = "30d", customRange?: DateRange) {
  return useQuery({
    queryKey: ["admin-content-metrics", period, customRange?.from?.toISOString(), customRange?.to?.toISOString()],
    queryFn: async (): Promise<ContentMetrics> => {
      const { start, end } = getDateRange(period, customRange);
      const { start: prevStart, end: prevEnd } = getPreviousPeriodRange(period, customRange);
      const weekStart = startOfDay(subDays(new Date(), 7)).toISOString();

      // Get total products
      const { count: totalProducts } = await supabase
        .from("products")
        .select("*", { count: "exact", head: true });

      // Get published products
      const { count: publishedProducts } = await supabase
        .from("products")
        .select("*", { count: "exact", head: true })
        .eq("status", "published");

      // Get draft products  
      const { count: draftProducts } = await supabase
        .from("products")
        .select("*", { count: "exact", head: true })
        .eq("status", "draft");

      // Get total posts
      const { count: totalPosts } = await supabase
        .from("posts")
        .select("*", { count: "exact", head: true });

      // Get total collections
      const { count: totalCollections } = await supabase
        .from("collections")
        .select("*", { count: "exact", head: true });

      // Get products in selected period
      const { count: productsInPeriod } = await supabase
        .from("products")
        .select("*", { count: "exact", head: true })
        .gte("created_at", start.toISOString())
        .lte("created_at", end.toISOString());

      // Get posts in selected period
      const { count: postsInPeriod } = await supabase
        .from("posts")
        .select("*", { count: "exact", head: true })
        .gte("created_at", start.toISOString())
        .lte("created_at", end.toISOString());

      // Get products in previous period
      const { count: previousPeriodProducts } = await supabase
        .from("products")
        .select("*", { count: "exact", head: true })
        .gte("created_at", prevStart.toISOString())
        .lte("created_at", prevEnd.toISOString());

      // Get posts in previous period
      const { count: previousPeriodPosts } = await supabase
        .from("posts")
        .select("*", { count: "exact", head: true })
        .gte("created_at", prevStart.toISOString())
        .lte("created_at", prevEnd.toISOString());

      // Get products this week
      const { count: productsThisWeek } = await supabase
        .from("products")
        .select("*", { count: "exact", head: true })
        .gte("created_at", weekStart);

      // Get posts this week
      const { count: postsThisWeek } = await supabase
        .from("posts")
        .select("*", { count: "exact", head: true })
        .gte("created_at", weekStart);

      return {
        totalProducts: totalProducts || 0,
        totalPosts: totalPosts || 0,
        totalCollections: totalCollections || 0,
        productsInPeriod: productsInPeriod || 0,
        postsInPeriod: postsInPeriod || 0,
        previousPeriodProducts: previousPeriodProducts || 0,
        previousPeriodPosts: previousPeriodPosts || 0,
        productsThisWeek: productsThisWeek || 0,
        postsThisWeek: postsThisWeek || 0,
        publishedProducts: publishedProducts || 0,
        draftProducts: draftProducts || 0,
      };
    },
    staleTime: 1000 * 60 * 5,
    refetchInterval: 1000 * 60 * 5,
  });
}

// ==================== Engagement Metrics ====================

export interface EngagementMetrics {
  totalClicks: number;
  totalFavorites: number;
  totalFollows: number;
  clicksInPeriod: number;
  favoritesInPeriod: number;
  followsInPeriod: number;
  previousPeriodClicks: number;
  previousPeriodFavorites: number;
  previousPeriodFollows: number;
  clicksToday: number;
  clicksThisWeek: number;
  clicksThisMonth: number;
  favoritesToday: number;
  followsToday: number;
  avgClicksPerProduct: number;
  avgFavoritesPerProduct: number;
}

export function useEngagementMetrics(period: Period = "30d", customRange?: DateRange) {
  return useQuery({
    queryKey: ["admin-engagement-metrics", period, customRange?.from?.toISOString(), customRange?.to?.toISOString()],
    queryFn: async (): Promise<EngagementMetrics> => {
      const { start, end } = getDateRange(period, customRange);
      const { start: prevStart, end: prevEnd } = getPreviousPeriodRange(period, customRange);
      
      const now = new Date();
      const todayStart = startOfDay(now).toISOString();
      const weekStart = startOfDay(subDays(now, 7)).toISOString();
      const monthStart = startOfDay(subDays(now, 30)).toISOString();

      // Get total clicks
      const { count: totalClicks } = await supabase
        .from("clicks")
        .select("*", { count: "exact", head: true });

      // Get clicks in selected period
      const { count: clicksInPeriod } = await supabase
        .from("clicks")
        .select("*", { count: "exact", head: true })
        .gte("created_at", start.toISOString())
        .lte("created_at", end.toISOString());

      // Get clicks in previous period
      const { count: previousPeriodClicks } = await supabase
        .from("clicks")
        .select("*", { count: "exact", head: true })
        .gte("created_at", prevStart.toISOString())
        .lte("created_at", prevEnd.toISOString());

      // Get clicks today
      const { count: clicksToday } = await supabase
        .from("clicks")
        .select("*", { count: "exact", head: true })
        .gte("created_at", todayStart);

      // Get clicks this week
      const { count: clicksThisWeek } = await supabase
        .from("clicks")
        .select("*", { count: "exact", head: true })
        .gte("created_at", weekStart);

      // Get clicks this month
      const { count: clicksThisMonth } = await supabase
        .from("clicks")
        .select("*", { count: "exact", head: true })
        .gte("created_at", monthStart);

      // Get total favorites
      const { count: totalFavorites } = await supabase
        .from("favorites")
        .select("*", { count: "exact", head: true });

      // Get favorites in selected period
      const { count: favoritesInPeriod } = await supabase
        .from("favorites")
        .select("*", { count: "exact", head: true })
        .gte("created_at", start.toISOString())
        .lte("created_at", end.toISOString());

      // Get favorites in previous period
      const { count: previousPeriodFavorites } = await supabase
        .from("favorites")
        .select("*", { count: "exact", head: true })
        .gte("created_at", prevStart.toISOString())
        .lte("created_at", prevEnd.toISOString());

      // Get favorites today
      const { count: favoritesToday } = await supabase
        .from("favorites")
        .select("*", { count: "exact", head: true })
        .gte("created_at", todayStart);

      // Get total follows
      const { count: totalFollows } = await supabase
        .from("follows")
        .select("*", { count: "exact", head: true });

      // Get follows in selected period
      const { count: followsInPeriod } = await supabase
        .from("follows")
        .select("*", { count: "exact", head: true })
        .gte("created_at", start.toISOString())
        .lte("created_at", end.toISOString());

      // Get follows in previous period
      const { count: previousPeriodFollows } = await supabase
        .from("follows")
        .select("*", { count: "exact", head: true })
        .gte("created_at", prevStart.toISOString())
        .lte("created_at", prevEnd.toISOString());

      // Get follows today
      const { count: followsToday } = await supabase
        .from("follows")
        .select("*", { count: "exact", head: true })
        .gte("created_at", todayStart);

      // Get product count for averages
      const { count: productCount } = await supabase
        .from("products")
        .select("*", { count: "exact", head: true });

      const products = productCount || 1;

      return {
        totalClicks: totalClicks || 0,
        totalFavorites: totalFavorites || 0,
        totalFollows: totalFollows || 0,
        clicksInPeriod: clicksInPeriod || 0,
        favoritesInPeriod: favoritesInPeriod || 0,
        followsInPeriod: followsInPeriod || 0,
        previousPeriodClicks: previousPeriodClicks || 0,
        previousPeriodFavorites: previousPeriodFavorites || 0,
        previousPeriodFollows: previousPeriodFollows || 0,
        clicksToday: clicksToday || 0,
        clicksThisWeek: clicksThisWeek || 0,
        clicksThisMonth: clicksThisMonth || 0,
        favoritesToday: favoritesToday || 0,
        followsToday: followsToday || 0,
        avgClicksPerProduct: (totalClicks || 0) / products,
        avgFavoritesPerProduct: (totalFavorites || 0) / products,
      };
    },
    staleTime: 1000 * 60 * 2, // 2 minutes for engagement data
    refetchInterval: 1000 * 60 * 2,
  });
}

// ==================== Moderation Metrics ====================

export interface ModerationMetrics {
  pendingReports: number;
  resolvedReportsToday: number;
  totalReports: number;
  reportsInPeriod: number;
  previousPeriodReports: number;
  reportsByReason: { reason: string; count: number }[];
}

export function useModerationMetrics(period: Period = "30d", customRange?: DateRange) {
  return useQuery({
    queryKey: ["admin-moderation-metrics", period, customRange?.from?.toISOString(), customRange?.to?.toISOString()],
    queryFn: async (): Promise<ModerationMetrics> => {
      const { start, end } = getDateRange(period, customRange);
      const { start: prevStart, end: prevEnd } = getPreviousPeriodRange(period, customRange);
      const todayStart = startOfDay(new Date()).toISOString();

      // Get pending reports
      const { count: pendingReports } = await supabase
        .from("reports")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending");

      // Get total reports
      const { count: totalReports } = await supabase
        .from("reports")
        .select("*", { count: "exact", head: true });

      // Get reports in selected period
      const { count: reportsInPeriod } = await supabase
        .from("reports")
        .select("*", { count: "exact", head: true })
        .gte("created_at", start.toISOString())
        .lte("created_at", end.toISOString());

      // Get reports in previous period
      const { count: previousPeriodReports } = await supabase
        .from("reports")
        .select("*", { count: "exact", head: true })
        .gte("created_at", prevStart.toISOString())
        .lte("created_at", prevEnd.toISOString());

      // Get resolved reports today
      const { count: resolvedReportsToday } = await supabase
        .from("reports")
        .select("*", { count: "exact", head: true })
        .eq("status", "resolved")
        .gte("reviewed_at", todayStart);

      // Get reports by reason
      const { data: reportsByReasonData } = await supabase
        .from("reports")
        .select("reason")
        .eq("status", "pending");

      const reasonCounts: Record<string, number> = {};
      reportsByReasonData?.forEach(r => {
        reasonCounts[r.reason] = (reasonCounts[r.reason] || 0) + 1;
      });

      const reportsByReason = Object.entries(reasonCounts).map(([reason, count]) => ({
        reason,
        count,
      }));

      return {
        pendingReports: pendingReports || 0,
        resolvedReportsToday: resolvedReportsToday || 0,
        totalReports: totalReports || 0,
        reportsInPeriod: reportsInPeriod || 0,
        previousPeriodReports: previousPeriodReports || 0,
        reportsByReason,
      };
    },
    staleTime: 1000 * 60 * 2,
    refetchInterval: 1000 * 60 * 2,
  });
}

// ==================== Subscription Metrics ====================

export interface SubscriptionMetrics {
  activeSubscriptions: number;
  totalRevenue: number;
  mrr: number;
  newSubscriptionsInPeriod: number;
  previousPeriodSubscriptions: number;
  newSubscriptionsThisMonth: number;
  canceledThisMonth: number;
  churnRate: number;
}

export function useSubscriptionMetrics(period: Period = "30d", customRange?: DateRange) {
  return useQuery({
    queryKey: ["admin-subscription-metrics", period, customRange?.from?.toISOString(), customRange?.to?.toISOString()],
    queryFn: async (): Promise<SubscriptionMetrics> => {
      const { start, end } = getDateRange(period, customRange);
      const { start: prevStart, end: prevEnd } = getPreviousPeriodRange(period, customRange);
      const monthStart = startOfDay(subDays(new Date(), 30)).toISOString();

      // Get active subscriptions
      const { count: activeSubscriptions, data: activeSubsData } = await supabase
        .from("subscriptions")
        .select("*", { count: "exact" })
        .eq("status", "active");

      // Get new subscriptions in selected period
      const { count: newSubscriptionsInPeriod } = await supabase
        .from("subscriptions")
        .select("*", { count: "exact", head: true })
        .gte("created_at", start.toISOString())
        .lte("created_at", end.toISOString());

      // Get subscriptions in previous period
      const { count: previousPeriodSubscriptions } = await supabase
        .from("subscriptions")
        .select("*", { count: "exact", head: true })
        .gte("created_at", prevStart.toISOString())
        .lte("created_at", prevEnd.toISOString());

      // Get new subscriptions this month
      const { count: newSubscriptionsThisMonth } = await supabase
        .from("subscriptions")
        .select("*", { count: "exact", head: true })
        .gte("created_at", monthStart);

      // Get canceled subscriptions this month
      const { count: canceledThisMonth } = await supabase
        .from("subscriptions")
        .select("*", { count: "exact", head: true })
        .eq("status", "canceled")
        .gte("updated_at", monthStart);

      // Calculate MRR (assuming R$ 49.90 per subscription)
      const pricePerSub = 49.90;
      const mrr = (activeSubscriptions || 0) * pricePerSub;

      // Calculate churn rate
      const previousMonthSubs = (activeSubscriptions || 0) + (canceledThisMonth || 0);
      const churnRate = previousMonthSubs > 0 
        ? ((canceledThisMonth || 0) / previousMonthSubs) * 100 
        : 0;

      return {
        activeSubscriptions: activeSubscriptions || 0,
        totalRevenue: mrr * 12, // Estimated ARR
        mrr,
        newSubscriptionsInPeriod: newSubscriptionsInPeriod || 0,
        previousPeriodSubscriptions: previousPeriodSubscriptions || 0,
        newSubscriptionsThisMonth: newSubscriptionsThisMonth || 0,
        canceledThisMonth: canceledThisMonth || 0,
        churnRate,
      };
    },
    staleTime: 1000 * 60 * 5,
    refetchInterval: 1000 * 60 * 5,
  });
}

// ==================== Top Items ====================

export interface TopProduct {
  id: string;
  title: string;
  clicks: number;
  favorites: number;
  creator_name: string;
}

export interface TopCreator {
  id: string;
  username: string;
  name: string;
  followers: number;
  products: number;
}

export function useTopProducts(limit = 5) {
  return useQuery({
    queryKey: ["admin-top-products", limit],
    queryFn: async (): Promise<TopProduct[]> => {
      const { data } = await supabase
        .from("products")
        .select(`
          id,
          title,
          click_count,
          favorite_count,
          profiles:creator_id (name, username)
        `)
        .order("click_count", { ascending: false })
        .limit(limit);

      return (data || []).map(p => ({
        id: p.id,
        title: p.title,
        clicks: p.click_count || 0,
        favorites: p.favorite_count || 0,
        creator_name: (p.profiles as any)?.name || (p.profiles as any)?.username || "Unknown",
      }));
    },
    staleTime: 1000 * 60 * 10,
  });
}

export function useTopCreators(limit = 5) {
  return useQuery({
    queryKey: ["admin-top-creators", limit],
    queryFn: async (): Promise<TopCreator[]> => {
      // Get all profiles with their product counts
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, username, name")
        .limit(100);

      if (!profiles) return [];

      // Get follower counts for each profile
      const creatorsWithStats = await Promise.all(
        profiles.map(async (profile) => {
          const { count: followers } = await supabase
            .from("follows")
            .select("*", { count: "exact", head: true })
            .eq("creator_id", profile.id);

          const { count: products } = await supabase
            .from("products")
            .select("*", { count: "exact", head: true })
            .eq("creator_id", profile.id);

          return {
            id: profile.id,
            username: profile.username,
            name: profile.name,
            followers: followers || 0,
            products: products || 0,
          };
        })
      );

      // Filter out profiles with no products (not creators) and sort by followers
      return creatorsWithStats
        .filter(c => c.products > 0)
        .sort((a, b) => b.followers - a.followers)
        .slice(0, limit);
    },
    staleTime: 1000 * 60 * 10,
  });
}

// ==================== Time Series Data ====================

export interface DailyMetric {
  date: string;
  clicks: number;
  favorites: number;
  signups: number;
}

export function useDailyMetrics(period: Period = "30d", customRange?: DateRange) {
  return useQuery({
    queryKey: ["admin-daily-metrics", period, customRange?.from?.toISOString(), customRange?.to?.toISOString()],
    queryFn: async (): Promise<DailyMetric[]> => {
      const { start, end } = getDateRange(period, customRange);
      
      // Get all clicks in range
      const { data: clicks } = await supabase
        .from("clicks")
        .select("created_at")
        .gte("created_at", start.toISOString())
        .lte("created_at", end.toISOString());

      // Get all favorites in range
      const { data: favorites } = await supabase
        .from("favorites")
        .select("created_at")
        .gte("created_at", start.toISOString())
        .lte("created_at", end.toISOString());

      // Get all signups in range
      const { data: signups } = await supabase
        .from("profiles")
        .select("created_at")
        .gte("created_at", start.toISOString())
        .lte("created_at", end.toISOString());

      // Group by date
      const days: Record<string, DailyMetric> = {};
      
      // Initialize all days in range
      const dayCount = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      for (let i = 0; i < dayCount; i++) {
        const date = new Date(start);
        date.setDate(date.getDate() + i);
        const dateStr = format(date, "yyyy-MM-dd");
        days[dateStr] = { date: dateStr, clicks: 0, favorites: 0, signups: 0 };
      }

      // Count clicks per day
      clicks?.forEach(c => {
        const dateStr = format(new Date(c.created_at), "yyyy-MM-dd");
        if (days[dateStr]) days[dateStr].clicks++;
      });

      // Count favorites per day
      favorites?.forEach(f => {
        const dateStr = format(new Date(f.created_at), "yyyy-MM-dd");
        if (days[dateStr]) days[dateStr].favorites++;
      });

      // Count signups per day
      signups?.forEach(s => {
        const dateStr = format(new Date(s.created_at), "yyyy-MM-dd");
        if (days[dateStr]) days[dateStr].signups++;
      });

      return Object.values(days).sort((a, b) => a.date.localeCompare(b.date));
    },
    staleTime: 1000 * 60 * 5,
  });
}

// ==================== Recent Activity ====================

export interface RecentActivityItem {
  id: string;
  type: "signup" | "product" | "post" | "favorite" | "follow" | "report";
  description: string;
  timestamp: Date;
  user?: {
    name: string;
    avatar?: string;
  };
  resourceUrl?: string;
}

export function useRecentActivity(limit = 10) {
  return useQuery({
    queryKey: ["admin-recent-activity", limit],
    queryFn: async (): Promise<RecentActivityItem[]> => {
      const activities: RecentActivityItem[] = [];

      // Get recent products
      const { data: products } = await supabase
        .from("products")
        .select("id, title, created_at, profiles:creator_id (name, username, avatar_url)")
        .order("created_at", { ascending: false })
        .limit(limit);

      products?.forEach(p => {
        const profile = p.profiles as any;
        activities.push({
          id: `product-${p.id}`,
          type: "product",
          description: `${profile?.name || profile?.username} adicionou produto "${p.title}"`,
          timestamp: new Date(p.created_at),
          user: { name: profile?.name || profile?.username, avatar: profile?.avatar_url },
          resourceUrl: `/admin/content`,
        });
      });

      // Get recent posts
      const { data: posts } = await supabase
        .from("posts")
        .select("id, created_at, profiles:creator_id (name, username, avatar_url)")
        .order("created_at", { ascending: false })
        .limit(limit);

      posts?.forEach(p => {
        const profile = p.profiles as any;
        activities.push({
          id: `post-${p.id}`,
          type: "post",
          description: `${profile?.name || profile?.username} publicou novo post`,
          timestamp: new Date(p.created_at),
          user: { name: profile?.name || profile?.username, avatar: profile?.avatar_url },
          resourceUrl: `/admin/content`,
        });
      });

      // Get recent follows
      const { data: follows } = await supabase
        .from("follows")
        .select("id, created_at, profiles:creator_id (name, username, avatar_url)")
        .order("created_at", { ascending: false })
        .limit(limit);

      follows?.forEach(f => {
        const profile = f.profiles as any;
        activities.push({
          id: `follow-${f.id}`,
          type: "follow",
          description: `${profile?.name || profile?.username} ganhou novo follower`,
          timestamp: new Date(f.created_at),
          user: { name: profile?.name || profile?.username, avatar: profile?.avatar_url },
        });
      });

      // Get recent reports
      const { data: reports } = await supabase
        .from("reports")
        .select("id, reason, created_at, reported_type")
        .order("created_at", { ascending: false })
        .eq("status", "pending")
        .limit(limit);

      reports?.forEach(r => {
        activities.push({
          id: `report-${r.id}`,
          type: "report",
          description: `Novo report: ${r.reason} (${r.reported_type})`,
          timestamp: new Date(r.created_at),
          resourceUrl: `/admin/moderation`,
        });
      });

      // Sort by timestamp and return top items
      return activities
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, limit);
    },
    staleTime: 1000 * 60 * 2,
    refetchInterval: 1000 * 60 * 2,
  });
}

// ==================== North Star Metric ====================

export interface NorthStarData {
  value: number;
  previousValue: number;
  delta: number;
  goal: number;
  chartData: { date: string; value: number }[];
}

export function useNorthStarMetric(period: Period = "30d", customRange?: DateRange) {
  return useQuery({
    queryKey: ["admin-north-star", period, customRange?.from?.toISOString(), customRange?.to?.toISOString()],
    queryFn: async (): Promise<NorthStarData> => {
      const { start, end } = getDateRange(period, customRange);
      const { start: prevStart, end: prevEnd } = getPreviousPeriodRange(period, customRange);

      // Get total clicks in selected period
      const { count: clicksInPeriod } = await supabase
        .from("clicks")
        .select("*", { count: "exact", head: true })
        .gte("created_at", start.toISOString())
        .lte("created_at", end.toISOString());

      // Get total clicks in previous period
      const { count: clicksPrevPeriod } = await supabase
        .from("clicks")
        .select("*", { count: "exact", head: true })
        .gte("created_at", prevStart.toISOString())
        .lte("created_at", prevEnd.toISOString());

      // Get active creators (with products in selected period)
      const { data: recentProducts } = await supabase
        .from("products")
        .select("creator_id")
        .gte("created_at", start.toISOString())
        .lte("created_at", end.toISOString());

      const activeCreators = new Set(recentProducts?.map(p => p.creator_id) || []);
      const activeCreatorCount = Math.max(activeCreators.size, 1);

      // Get previous period active creators
      const { data: prevProducts } = await supabase
        .from("products")
        .select("creator_id")
        .gte("created_at", prevStart.toISOString())
        .lte("created_at", prevEnd.toISOString());

      const prevActiveCreators = new Set(prevProducts?.map(p => p.creator_id) || []);
      const prevActiveCreatorCount = Math.max(prevActiveCreators.size, 1);

      // Calculate clicks per active creator
      const value = (clicksInPeriod || 0) / activeCreatorCount;
      const previousValue = (clicksPrevPeriod || 0) / prevActiveCreatorCount;
      const delta = previousValue > 0 ? ((value - previousValue) / previousValue) * 100 : 0;

      // Generate chart data from actual clicks
      const chartData: { date: string; value: number }[] = [];
      const dayCount = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      
      for (let i = 0; i < dayCount; i++) {
        const date = new Date(start);
        date.setDate(date.getDate() + i);
        const dateStr = format(date, "dd/MM");
        
        const { count } = await supabase
          .from("clicks")
          .select("*", { count: "exact", head: true })
          .gte("created_at", startOfDay(date).toISOString())
          .lt("created_at", endOfDay(date).toISOString());

        chartData.push({
          date: dateStr,
          value: (count || 0) / Math.max(activeCreatorCount, 1),
        });
      }

      return {
        value,
        previousValue,
        delta,
        goal: 50, // Q1 goal: 50 clicks per active creator
        chartData,
      };
    },
    staleTime: 1000 * 60 * 10,
  });
}
