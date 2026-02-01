import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[ADMIN-STRIPE-METRICS] ${step}${detailsStr}`);
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    // Initialize Supabase client with service role
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Verify admin user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header provided");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError) {
      throw new Error(`Authentication error: ${userError.message}`);
    }

    const user = userData.user;
    if (!user?.email) {
      throw new Error("User not authenticated");
    }

    // Check if user is admin
    const { data: adminRole } = await supabaseClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .single();

    if (!adminRole) {
      throw new Error("User is not an admin");
    }

    logStep("Admin user verified", { userId: user.id });

    // Initialize Stripe
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      logStep("STRIPE_SECRET_KEY not set - returning empty metrics");
      return new Response(JSON.stringify({
        mrr: 0,
        arr: 0,
        activeSubscriptions: 0,
        newSubscriptionsThisMonth: 0,
        canceledThisMonth: 0,
        churnRate: 0,
        revenueHistory: [],
        subscriptionsByPlan: [],
        recentSubscriptions: [],
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    logStep("Stripe initialized");

    // Get current date info
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Fetch all active subscriptions
    const activeSubscriptions = await stripe.subscriptions.list({
      status: "active",
      limit: 100,
    });
    logStep("Fetched active subscriptions", { count: activeSubscriptions.data.length });

    // Fetch canceled subscriptions this month
    const canceledSubscriptions = await stripe.subscriptions.list({
      status: "canceled",
      created: { gte: Math.floor(startOfMonth.getTime() / 1000) },
      limit: 100,
    });
    logStep("Fetched canceled subscriptions", { count: canceledSubscriptions.data.length });

    // Calculate MRR from active subscriptions
    let mrr = 0;
    const subscriptionsByPlan: { plan: string; count: number; revenue: number }[] = [];
    const planCounts: Record<string, { count: number; revenue: number }> = {};

    for (const sub of activeSubscriptions.data) {
      for (const item of sub.items.data) {
        const amount = item.price.unit_amount || 0;
        const interval = item.price.recurring?.interval || "month";
        const intervalCount = item.price.recurring?.interval_count || 1;

        // Convert to monthly
        let monthlyAmount = amount / 100;
        if (interval === "year") {
          monthlyAmount = monthlyAmount / 12;
        } else if (interval === "week") {
          monthlyAmount = monthlyAmount * 4.33 / intervalCount;
        } else if (interval === "day") {
          monthlyAmount = monthlyAmount * 30 / intervalCount;
        }

        mrr += monthlyAmount;

        // Track by plan
        const planName = item.price.nickname || item.price.product as string || "Unknown";
        if (!planCounts[planName]) {
          planCounts[planName] = { count: 0, revenue: 0 };
        }
        planCounts[planName].count++;
        planCounts[planName].revenue += monthlyAmount;
      }
    }

    // Convert plan counts to array
    for (const [plan, data] of Object.entries(planCounts)) {
      subscriptionsByPlan.push({
        plan,
        count: data.count,
        revenue: data.revenue,
      });
    }

    // Fetch new subscriptions this month
    const newSubscriptions = await stripe.subscriptions.list({
      status: "all",
      created: { gte: Math.floor(startOfMonth.getTime() / 1000) },
      limit: 100,
    });

    const newThisMonth = newSubscriptions.data.filter(
      (sub: { status: string }) => sub.status === "active" || sub.status === "trialing"
    ).length;

    // Calculate churn rate
    const previousActiveCount = activeSubscriptions.data.length + canceledSubscriptions.data.length;
    const churnRate = previousActiveCount > 0
      ? (canceledSubscriptions.data.length / previousActiveCount) * 100
      : 0;

    // Get revenue history from balance transactions
    const revenueHistory: { month: string; revenue: number }[] = [];
    
    // Get last 12 months of charges
    for (let i = 11; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
      
      const charges = await stripe.charges.list({
        created: {
          gte: Math.floor(monthStart.getTime() / 1000),
          lte: Math.floor(monthEnd.getTime() / 1000),
        },
        limit: 100,
      });

      const monthRevenue = charges.data
        .filter((c: { paid: boolean; refunded: boolean }) => c.paid && !c.refunded)
        .reduce((sum: number, c: { amount: number }) => sum + (c.amount / 100), 0);

      revenueHistory.push({
        month: monthStart.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" }),
        revenue: monthRevenue,
      });
    }

    // Get recent subscription events
    const recentSubscriptions = activeSubscriptions.data.slice(0, 5).map((sub: any) => ({
      id: sub.id,
      customerEmail: sub.customer as string,
      status: sub.status,
      amount: (sub.items.data[0]?.price.unit_amount || 0) / 100,
      interval: sub.items.data[0]?.price.recurring?.interval || "month",
      createdAt: new Date(sub.created * 1000).toISOString(),
    }));

    const response = {
      mrr: Math.round(mrr * 100) / 100,
      arr: Math.round(mrr * 12 * 100) / 100,
      activeSubscriptions: activeSubscriptions.data.length,
      newSubscriptionsThisMonth: newThisMonth,
      canceledThisMonth: canceledSubscriptions.data.length,
      churnRate: Math.round(churnRate * 100) / 100,
      revenueHistory,
      subscriptionsByPlan,
      recentSubscriptions,
    };

    logStep("Returning metrics", response);

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
