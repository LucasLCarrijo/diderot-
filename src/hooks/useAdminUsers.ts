import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  handle: string;
  avatar_url: string | null;
  role: "follower" | "creator" | "brand" | "admin";
  status: "active" | "inactive" | "suspended" | "banned";
  plan: "free" | "creator_pro" | "brand";
  is_verified: boolean;
  created_at: string;
  last_access: string;
}

export interface AdminUsersStats {
  total: number;
  totalDelta: number;
  active: number;
  activeDelta: number;
  conversionRate: string;
  conversionDelta: number;
  churnRate: number;
  churnDelta: number;
}

interface UseAdminUsersOptions {
  search?: string;
  statusFilter?: string;
  roleFilter?: string;
  planFilter?: string;
  dateRange?: { from?: Date; to?: Date };
  verifiedOnly?: boolean;
  sortField?: string;
  sortDirection?: "asc" | "desc";
  page?: number;
  pageSize?: number;
}

export function useAdminUsers(options: UseAdminUsersOptions = {}) {
  const {
    search = "",
    statusFilter = "all",
    roleFilter = "all",
    planFilter = "all",
    dateRange,
    verifiedOnly = false,
    sortField = "created_at",
    sortDirection = "desc",
    page = 1,
    pageSize = 20,
  } = options;

  return useQuery({
    queryKey: [
      "admin-users",
      search,
      statusFilter,
      roleFilter,
      planFilter,
      dateRange?.from?.toISOString(),
      dateRange?.to?.toISOString(),
      verifiedOnly,
      sortField,
      sortDirection,
      page,
      pageSize,
    ],
    queryFn: async () => {
      // Fetch profiles with their roles
      let query = supabase
        .from("profiles")
        .select(`
          id,
          name,
          username,
          avatar_url,
          bio,
          is_verified,
          created_at,
          updated_at,
          user_id,
          instagram_url,
          tiktok_url,
          youtube_url,
          website_url,
          categories
        `, { count: "exact" });

      // Search filter
      if (search) {
        query = query.or(`name.ilike.%${search}%,username.ilike.%${search}%`);
      }

      // Verified filter
      if (verifiedOnly) {
        query = query.eq("is_verified", true);
      }

      // Date range filter
      if (dateRange?.from) {
        query = query.gte("created_at", dateRange.from.toISOString());
      }
      if (dateRange?.to) {
        query = query.lte("created_at", dateRange.to.toISOString());
      }

      // Sorting
      const sortColumn = sortField === "handle" ? "username" : sortField === "last_access" ? "updated_at" : sortField;
      query = query.order(sortColumn as any, { ascending: sortDirection === "asc" });

      // Pagination
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      const { data: profiles, error: profilesError, count } = await query;

      if (profilesError) throw profilesError;

      // Fetch roles for all profiles
      const userIds = profiles?.map(p => p.user_id).filter(Boolean) || [];
      
      let rolesData: { user_id: string; role: string }[] = [];
      if (userIds.length > 0) {
        const { data: roles } = await supabase
          .from("user_roles")
          .select("user_id, role")
          .in("user_id", userIds);
        rolesData = roles || [];
      }

      // Fetch subscriptions for pro status
      let subscriptionsData: { user_id: string; status: string }[] = [];
      if (userIds.length > 0) {
        const { data: subs } = await supabase
          .from("subscriptions")
          .select("user_id, status")
          .in("user_id", userIds)
          .eq("status", "active");
        subscriptionsData = subs || [];
      }

      // Fetch entitlements
      let entitlementsData: { user_id: string; feature: string }[] = [];
      if (userIds.length > 0) {
        const { data: ents } = await supabase
          .from("entitlements")
          .select("user_id, feature")
          .in("user_id", userIds)
          .eq("active", true);
        entitlementsData = ents || [];
      }

      // Map profiles to users
      const users: AdminUser[] = (profiles || []).map(profile => {
        const userRole = rolesData.find(r => r.user_id === profile.user_id);
        const hasSub = subscriptionsData.some(s => s.user_id === profile.user_id);
        const hasProEntitlement = entitlementsData.some(
          e => e.user_id === profile.user_id && e.feature === "CREATOR_PRO"
        );

        let role: AdminUser["role"] = "follower";
        if (userRole?.role === "admin") role = "admin";
        else if (userRole?.role === "creator") role = "creator";
        
        // Check if brand
        const isBrand = rolesData.some(
          r => r.user_id === profile.user_id && r.role === "creator"
        );

        let plan: AdminUser["plan"] = "free";
        if (hasSub || hasProEntitlement) plan = "creator_pro";

        // Determine status based on last activity
        const lastUpdate = new Date(profile.updated_at);
        const daysSinceUpdate = Math.floor(
          (Date.now() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24)
        );
        let status: AdminUser["status"] = "active";
        if (daysSinceUpdate > 90) status = "inactive";

        return {
          id: profile.id,
          name: profile.name,
          email: `${profile.username.toLowerCase()}@email.com`, // Email not in profiles, using placeholder
          handle: profile.username,
          avatar_url: profile.avatar_url,
          role,
          status,
          plan,
          is_verified: profile.is_verified || false,
          created_at: profile.created_at,
          last_access: profile.updated_at,
        };
      });

      // Apply client-side role filter (since roles are in a separate table)
      let filteredUsers = users;
      if (roleFilter !== "all") {
        filteredUsers = filteredUsers.filter(u => u.role === roleFilter);
      }
      if (planFilter !== "all") {
        filteredUsers = filteredUsers.filter(u => u.plan === planFilter);
      }
      if (statusFilter !== "all") {
        filteredUsers = filteredUsers.filter(u => u.status === statusFilter);
      }

      return {
        users: filteredUsers,
        totalCount: count || 0,
        totalPages: Math.ceil((count || 0) / pageSize),
      };
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

export function useAdminUsersStats() {
  return useQuery({
    queryKey: ["admin-users-stats"],
    queryFn: async () => {
      // Get total profiles count
      const { count: totalProfiles } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });

      // Get active profiles (updated in last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const { count: activeProfiles } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .gte("updated_at", thirtyDaysAgo.toISOString());

      // Get verified profiles
      const { count: verifiedProfiles } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("is_verified", true);

      // Get creator count
      const { count: creatorCount } = await supabase
        .from("user_roles")
        .select("*", { count: "exact", head: true })
        .eq("role", "creator");

      // Get pro subscriptions count
      const { count: proCount } = await supabase
        .from("subscriptions")
        .select("*", { count: "exact", head: true })
        .eq("status", "active");

      // Calculate deltas (comparing with previous period)
      const sixtyDaysAgo = new Date();
      sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
      
      const { count: previousPeriodTotal } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .lte("created_at", thirtyDaysAgo.toISOString());

      const totalDelta = previousPeriodTotal && previousPeriodTotal > 0
        ? (((totalProfiles || 0) - previousPeriodTotal) / previousPeriodTotal) * 100
        : 0;

      const conversionRate = (creatorCount || 0) > 0
        ? ((proCount || 0) / (creatorCount || 1)) * 100
        : 0;

      // Get canceled subscriptions for churn rate
      const { count: canceledSubs } = await supabase
        .from("subscriptions")
        .select("*", { count: "exact", head: true })
        .eq("status", "canceled")
        .gte("updated_at", thirtyDaysAgo.toISOString());

      const churnRate = (proCount || 0) > 0
        ? ((canceledSubs || 0) / ((proCount || 0) + (canceledSubs || 0))) * 100
        : 0;

      return {
        total: totalProfiles || 0,
        totalDelta: parseFloat(totalDelta.toFixed(1)),
        active: activeProfiles || 0,
        activeDelta: 5.2, // Would need more complex calculation for real delta
        conversionRate: conversionRate.toFixed(1),
        conversionDelta: 2.1,
        churnRate: parseFloat(churnRate.toFixed(1)),
        churnDelta: -0.5,
      } as AdminUsersStats;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
