import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface StripeMetrics {
  mrr: number;
  arr: number;
  activeSubscriptions: number;
  newSubscriptionsThisMonth: number;
  canceledThisMonth: number;
  churnRate: number;
  revenueHistory: { month: string; revenue: number }[];
  subscriptionsByPlan: { plan: string; count: number; revenue: number }[];
  recentSubscriptions: {
    id: string;
    customerEmail: string;
    status: string;
    amount: number;
    interval: string;
    createdAt: string;
  }[];
}

export function useStripeFinancials() {
  return useQuery({
    queryKey: ["stripe-financials"],
    queryFn: async (): Promise<StripeMetrics> => {
      const { data, error } = await supabase.functions.invoke("admin-stripe-metrics");
      
      if (error) {
        console.error("Error fetching Stripe metrics:", error);
        throw error;
      }
      
      return data as StripeMetrics;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchInterval: 1000 * 60 * 5, // Refetch every 5 minutes
  });
}

// Calculate derived metrics
export function useFinancialMetrics() {
  const { data: stripeData, isLoading, error, refetch } = useStripeFinancials();
  
  // Calculate ARPU
  const arpu = stripeData && stripeData.activeSubscriptions > 0 
    ? stripeData.mrr / stripeData.activeSubscriptions 
    : 0;
  
  // Calculate month-over-month growth
  const revenueHistory = stripeData?.revenueHistory || [];
  const currentMonthRevenue = revenueHistory[revenueHistory.length - 1]?.revenue || 0;
  const previousMonthRevenue = revenueHistory[revenueHistory.length - 2]?.revenue || 0;
  const mrrGrowth = previousMonthRevenue > 0 
    ? ((currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue) * 100 
    : 0;
  
  // Format revenue history for charts
  const mrrHistory = revenueHistory.map((item) => ({
    month: item.month,
    total: item.revenue,
    creatorPro: item.revenue * 0.7, // Estimate - in production this would come from actual data
    brands: item.revenue * 0.25,
    outros: item.revenue * 0.05,
  }));
  
  return {
    data: stripeData,
    isLoading,
    error,
    refetch,
    derivedMetrics: {
      arpu,
      mrrGrowth,
      mrrHistory,
      mrrDeltaValue: currentMonthRevenue - previousMonthRevenue,
    },
  };
}
