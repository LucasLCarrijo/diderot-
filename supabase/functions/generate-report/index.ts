import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ReportRequest {
  reportTypes: string[];
  period: string;
  dateRange?: { from: string; to: string };
  options?: {
    comparison?: boolean;
    top10?: boolean;
    segmentation?: boolean;
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify admin auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if user is admin
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .single();

    if (!roles) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { reportTypes, period, dateRange, options }: ReportRequest = await req.json();
    console.log("Generating report:", { reportTypes, period, dateRange, options });

    // Calculate date range
    const now = new Date();
    let startDate: Date;
    let endDate = now;

    if (period === "custom" && dateRange?.from) {
      startDate = new Date(dateRange.from);
      endDate = dateRange.to ? new Date(dateRange.to) : now;
    } else {
      switch (period) {
        case "week":
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case "month":
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case "quarter":
          startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        case "year":
          startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      }
    }

    const startDateISO = startDate.toISOString();
    const endDateISO = endDate.toISOString();

    // Calculate previous period for comparison
    const periodDuration = endDate.getTime() - startDate.getTime();
    const prevStartDate = new Date(startDate.getTime() - periodDuration);
    const prevEndDate = startDate;
    const prevStartDateISO = prevStartDate.toISOString();
    const prevEndDateISO = prevEndDate.toISOString();

    const reportData: Record<string, any> = {
      generatedAt: now.toISOString(),
      period: {
        start: startDateISO,
        end: endDateISO,
        label: period,
      },
    };

    // Fetch data based on report types
    for (const reportType of reportTypes) {
      switch (reportType) {
        case "executive":
          reportData.executive = await getExecutiveData(supabase, startDateISO, endDateISO, prevStartDateISO, prevEndDateISO, options?.comparison);
          break;
        case "users":
          reportData.users = await getUsersData(supabase, startDateISO, endDateISO, prevStartDateISO, prevEndDateISO, options?.comparison);
          break;
        case "financial":
          reportData.financial = await getFinancialData(supabase, startDateISO, endDateISO, prevStartDateISO, prevEndDateISO, options?.comparison);
          break;
        case "engagement":
          reportData.engagement = await getEngagementData(supabase, startDateISO, endDateISO, prevStartDateISO, prevEndDateISO, options?.comparison, options?.top10);
          break;
        case "creators":
          reportData.creators = await getCreatorsData(supabase, startDateISO, endDateISO, options?.top10);
          break;
        case "products":
          reportData.products = await getProductsData(supabase, startDateISO, endDateISO, options?.top10);
          break;
        case "campaigns":
          reportData.campaigns = await getCampaignsData(supabase, startDateISO, endDateISO);
          break;
      }
    }

    console.log("Report data generated successfully");

    return new Response(JSON.stringify(reportData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error generating report:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function getExecutiveData(supabase: any, startDate: string, endDate: string, prevStart: string, prevEnd: string, comparison?: boolean) {
  // Current period counts
  const [profilesRes, productsRes, clicksRes, favoritesRes, followsRes, subscriptionsRes] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }).gte("created_at", startDate).lte("created_at", endDate),
    supabase.from("products").select("id", { count: "exact", head: true }).gte("created_at", startDate).lte("created_at", endDate),
    supabase.from("clicks").select("id", { count: "exact", head: true }).gte("created_at", startDate).lte("created_at", endDate),
    supabase.from("favorites").select("id", { count: "exact", head: true }).gte("created_at", startDate).lte("created_at", endDate),
    supabase.from("follows").select("id", { count: "exact", head: true }).gte("created_at", startDate).lte("created_at", endDate),
    supabase.from("subscriptions").select("id", { count: "exact", head: true }).eq("status", "active"),
  ]);

  const data: any = {
    newUsers: profilesRes.count || 0,
    newProducts: productsRes.count || 0,
    totalClicks: clicksRes.count || 0,
    totalFavorites: favoritesRes.count || 0,
    totalFollows: followsRes.count || 0,
    activeSubscriptions: subscriptionsRes.count || 0,
  };

  if (comparison) {
    const [prevProfilesRes, prevProductsRes, prevClicksRes, prevFavoritesRes, prevFollowsRes] = await Promise.all([
      supabase.from("profiles").select("id", { count: "exact", head: true }).gte("created_at", prevStart).lt("created_at", prevEnd),
      supabase.from("products").select("id", { count: "exact", head: true }).gte("created_at", prevStart).lt("created_at", prevEnd),
      supabase.from("clicks").select("id", { count: "exact", head: true }).gte("created_at", prevStart).lt("created_at", prevEnd),
      supabase.from("favorites").select("id", { count: "exact", head: true }).gte("created_at", prevStart).lt("created_at", prevEnd),
      supabase.from("follows").select("id", { count: "exact", head: true }).gte("created_at", prevStart).lt("created_at", prevEnd),
    ]);

    data.comparison = {
      newUsers: prevProfilesRes.count || 0,
      newProducts: prevProductsRes.count || 0,
      totalClicks: prevClicksRes.count || 0,
      totalFavorites: prevFavoritesRes.count || 0,
      totalFollows: prevFollowsRes.count || 0,
    };
  }

  return data;
}

async function getUsersData(supabase: any, startDate: string, endDate: string, prevStart: string, prevEnd: string, comparison?: boolean) {
  const { count: totalUsers } = await supabase.from("profiles").select("id", { count: "exact", head: true });
  const { count: newUsers } = await supabase.from("profiles").select("id", { count: "exact", head: true }).gte("created_at", startDate).lte("created_at", endDate);
  const { count: verifiedCreators } = await supabase.from("profiles").select("id", { count: "exact", head: true }).eq("is_verified", true);
  
  const { data: roleData } = await supabase.from("user_roles").select("role");
  const roleCounts = { admin: 0, creator: 0, follower: 0 };
  roleData?.forEach((r: any) => {
    if (roleCounts[r.role as keyof typeof roleCounts] !== undefined) {
      roleCounts[r.role as keyof typeof roleCounts]++;
    }
  });

  const data: any = {
    totalUsers: totalUsers || 0,
    newUsers: newUsers || 0,
    verifiedCreators: verifiedCreators || 0,
    roleDistribution: roleCounts,
  };

  if (comparison) {
    const { count: prevNewUsers } = await supabase.from("profiles").select("id", { count: "exact", head: true }).gte("created_at", prevStart).lt("created_at", prevEnd);
    data.comparison = { newUsers: prevNewUsers || 0 };
  }

  return data;
}

async function getFinancialData(supabase: any, startDate: string, endDate: string, prevStart: string, prevEnd: string, comparison?: boolean) {
  const { count: activeSubscriptions } = await supabase.from("subscriptions").select("id", { count: "exact", head: true }).eq("status", "active");
  const { count: newSubscriptions } = await supabase.from("subscriptions").select("id", { count: "exact", head: true }).gte("created_at", startDate).lte("created_at", endDate);
  const { count: canceledSubscriptions } = await supabase.from("subscriptions").select("id", { count: "exact", head: true }).eq("cancel_at_period_end", true);

  // Estimate MRR (R$ 49.90 per active subscription)
  const mrr = (activeSubscriptions || 0) * 49.90;
  const arr = mrr * 12;

  const data: any = {
    activeSubscriptions: activeSubscriptions || 0,
    newSubscriptions: newSubscriptions || 0,
    canceledSubscriptions: canceledSubscriptions || 0,
    mrr,
    arr,
    pricePerSubscription: 49.90,
  };

  if (comparison) {
    const { count: prevNewSubs } = await supabase.from("subscriptions").select("id", { count: "exact", head: true }).gte("created_at", prevStart).lt("created_at", prevEnd);
    data.comparison = { newSubscriptions: prevNewSubs || 0 };
  }

  return data;
}

async function getEngagementData(supabase: any, startDate: string, endDate: string, prevStart: string, prevEnd: string, comparison?: boolean, top10?: boolean) {
  const [clicksRes, favoritesRes, followsRes, postsRes] = await Promise.all([
    supabase.from("clicks").select("id", { count: "exact", head: true }).gte("created_at", startDate).lte("created_at", endDate),
    supabase.from("favorites").select("id", { count: "exact", head: true }).gte("created_at", startDate).lte("created_at", endDate),
    supabase.from("follows").select("id", { count: "exact", head: true }).gte("created_at", startDate).lte("created_at", endDate),
    supabase.from("posts").select("id", { count: "exact", head: true }).gte("created_at", startDate).lte("created_at", endDate),
  ]);

  const data: any = {
    totalClicks: clicksRes.count || 0,
    totalFavorites: favoritesRes.count || 0,
    totalFollows: followsRes.count || 0,
    newPosts: postsRes.count || 0,
  };

  if (top10) {
    const { data: topProducts } = await supabase
      .from("products")
      .select("id, title, click_count, favorite_count, store")
      .order("click_count", { ascending: false })
      .limit(10);
    data.topProducts = topProducts || [];
  }

  if (comparison) {
    const [prevClicksRes, prevFavoritesRes, prevFollowsRes] = await Promise.all([
      supabase.from("clicks").select("id", { count: "exact", head: true }).gte("created_at", prevStart).lt("created_at", prevEnd),
      supabase.from("favorites").select("id", { count: "exact", head: true }).gte("created_at", prevStart).lt("created_at", prevEnd),
      supabase.from("follows").select("id", { count: "exact", head: true }).gte("created_at", prevStart).lt("created_at", prevEnd),
    ]);

    data.comparison = {
      totalClicks: prevClicksRes.count || 0,
      totalFavorites: prevFavoritesRes.count || 0,
      totalFollows: prevFollowsRes.count || 0,
    };
  }

  return data;
}

async function getCreatorsData(supabase: any, startDate: string, endDate: string, top10?: boolean) {
  const { count: totalCreators } = await supabase.from("user_roles").select("id", { count: "exact", head: true }).eq("role", "creator");
  const { count: verifiedCreators } = await supabase.from("profiles").select("id", { count: "exact", head: true }).eq("is_verified", true);

  const data: any = {
    totalCreators: totalCreators || 0,
    verifiedCreators: verifiedCreators || 0,
  };

  if (top10) {
    const { data: topCreators } = await supabase
      .from("profiles")
      .select(`
        id, 
        name, 
        username, 
        is_verified,
        products:products(count)
      `)
      .order("created_at", { ascending: false })
      .limit(10);

    data.topCreators = topCreators?.map((c: any) => ({
      ...c,
      productCount: c.products?.[0]?.count || 0,
    })) || [];
  }

  return data;
}

async function getProductsData(supabase: any, startDate: string, endDate: string, top10?: boolean) {
  const { count: totalProducts } = await supabase.from("products").select("id", { count: "exact", head: true });
  const { count: newProducts } = await supabase.from("products").select("id", { count: "exact", head: true }).gte("created_at", startDate).lte("created_at", endDate);
  const { count: publishedProducts } = await supabase.from("products").select("id", { count: "exact", head: true }).eq("is_published", true);

  const data: any = {
    totalProducts: totalProducts || 0,
    newProducts: newProducts || 0,
    publishedProducts: publishedProducts || 0,
  };

  if (top10) {
    const { data: topByClicks } = await supabase
      .from("products")
      .select("id, title, click_count, favorite_count, store, creator:profiles(name, username)")
      .order("click_count", { ascending: false })
      .limit(10);

    const { data: topByFavorites } = await supabase
      .from("products")
      .select("id, title, click_count, favorite_count, store, creator:profiles(name, username)")
      .order("favorite_count", { ascending: false })
      .limit(10);

    data.topByClicks = topByClicks || [];
    data.topByFavorites = topByFavorites || [];
  }

  return data;
}

async function getCampaignsData(supabase: any, startDate: string, endDate: string) {
  const { count: totalCampaigns } = await supabase.from("campaigns").select("id", { count: "exact", head: true });
  const { count: activeCampaigns } = await supabase.from("campaigns").select("id", { count: "exact", head: true }).eq("status", "active");
  const { data: campaigns } = await supabase
    .from("campaigns")
    .select("id, title, budget, status, clicks, conversions, impressions, brand:brands(company_name)")
    .order("created_at", { ascending: false })
    .limit(20);

  const totalBudget = campaigns?.reduce((acc: number, c: any) => acc + (c.budget || 0), 0) || 0;

  return {
    totalCampaigns: totalCampaigns || 0,
    activeCampaigns: activeCampaigns || 0,
    totalBudget,
    campaigns: campaigns || [],
  };
}
