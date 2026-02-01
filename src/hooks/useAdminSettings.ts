import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// ==================== Types ====================

export interface FeaturedContent {
  id: string;
  content_type: "creator" | "product" | "collection";
  content_id: string;
  position: number;
  active: boolean;
  created_at: string;
  // Joined data
  name?: string;
  username?: string;
  avatar_url?: string;
  image_url?: string;
  title?: string;
  followers?: number;
  products?: number;
  price?: number;
}

export interface FeatureFlag {
  id: string;
  name: string;
  description: string | null;
  enabled: boolean;
  rollout_percentage: number;
  audience: "all" | "pro" | "whitelist";
  updated_at: string;
}

export interface AdminSetting {
  id: string;
  category: string;
  key: string;
  value: Record<string, any>;
  updated_at: string;
}

export interface AdminUser {
  id: string;
  user_id: string;
  email?: string;
  name?: string;
  avatar_url?: string;
  role: string;
  created_at: string;
  last_sign_in?: string;
}

export interface AuditLogEntry {
  id: string;
  admin_id: string;
  admin_email?: string;
  action: string;
  target_type: string | null;
  target_id: string | null;
  details: string | null;
  created_at: string;
}

export interface VerificationRequest {
  id: string;
  type: "creator" | "brand";
  name: string;
  username?: string;
  avatar_url?: string;
  followers?: number;
  products?: number;
  cnpj?: string;
  website?: string;
  segment?: string;
  company_size?: string;
  created_at: string;
  // Criteria checks
  hasProfileComplete?: boolean;
  hasMinFollowers?: boolean;
  hasMinProducts?: boolean;
  hasNoWarnings?: boolean;
}

// ==================== Featured Content ====================

export function useFeaturedCreators() {
  return useQuery({
    queryKey: ["admin-featured-creators"],
    queryFn: async (): Promise<FeaturedContent[]> => {
      const { data, error } = await supabase
        .from("featured_content")
        .select("*")
        .eq("content_type", "creator")
        .eq("active", true)
        .order("position");

      if (error) throw error;

      // Fetch creator details
      const results = await Promise.all(
        (data || []).map(async (item) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("name, username, avatar_url")
            .eq("id", item.content_id)
            .single();

          const { count: followers } = await supabase
            .from("follows")
            .select("*", { count: "exact", head: true })
            .eq("creator_id", item.content_id);

          return {
            ...item,
            name: profile?.name || "",
            username: profile?.username || "",
            avatar_url: profile?.avatar_url,
            followers: followers || 0,
          } as FeaturedContent;
        })
      );

      return results;
    },
  });
}

export function useFeaturedProducts() {
  return useQuery({
    queryKey: ["admin-featured-products"],
    queryFn: async (): Promise<FeaturedContent[]> => {
      const { data, error } = await supabase
        .from("featured_content")
        .select("*")
        .eq("content_type", "product")
        .eq("active", true)
        .order("position");

      if (error) throw error;

      const results = await Promise.all(
        (data || []).map(async (item) => {
          const { data: product } = await supabase
            .from("products")
            .select("title, image_url, price, profiles:creator_id(name)")
            .eq("id", item.content_id)
            .single();

          return {
            ...item,
            title: product?.title || "",
            image_url: product?.image_url,
            price: product?.price || 0,
            name: (product?.profiles as any)?.name || "",
          } as FeaturedContent;
        })
      );

      return results;
    },
  });
}

export function useFeaturedCollections() {
  return useQuery({
    queryKey: ["admin-featured-collections"],
    queryFn: async (): Promise<FeaturedContent[]> => {
      const { data, error } = await supabase
        .from("featured_content")
        .select("*")
        .eq("content_type", "collection")
        .eq("active", true)
        .order("position");

      if (error) throw error;

      const results = await Promise.all(
        (data || []).map(async (item) => {
          const { data: collection } = await supabase
            .from("collections")
            .select("name, thumbnail_url, profiles:creator_id(name)")
            .eq("id", item.content_id)
            .single();

          const { count: productCount } = await supabase
            .from("products")
            .select("*", { count: "exact", head: true })
            .eq("collection_id", item.content_id);

          return {
            ...item,
            name: collection?.name || "",
            title: collection?.name || "",
            image_url: collection?.thumbnail_url,
            products: productCount || 0,
            username: (collection?.profiles as any)?.name || "",
          } as FeaturedContent;
        })
      );

      return results;
    },
  });
}

export function useAddFeaturedContent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      content_type,
      content_id,
    }: {
      content_type: "creator" | "product" | "collection";
      content_id: string;
    }) => {
      const { data: user } = await supabase.auth.getUser();

      // Get max position
      const { data: existing } = await supabase
        .from("featured_content")
        .select("position")
        .eq("content_type", content_type)
        .order("position", { ascending: false })
        .limit(1);

      const position = (existing?.[0]?.position || 0) + 1;

      const { error } = await supabase.from("featured_content").insert({
        content_type,
        content_id,
        position,
        created_by: user.user?.id,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-featured"] });
      toast.success("Conteúdo adicionado aos destaques");
    },
    onError: (error) => {
      toast.error("Erro ao adicionar destaque: " + error.message);
    },
  });
}

export function useRemoveFeaturedContent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("featured_content")
        .update({ active: false })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-featured"] });
      toast.success("Conteúdo removido dos destaques");
    },
    onError: (error) => {
      toast.error("Erro ao remover destaque: " + error.message);
    },
  });
}

// ==================== Feature Flags ====================

export function useFeatureFlags() {
  return useQuery({
    queryKey: ["admin-feature-flags"],
    queryFn: async (): Promise<FeatureFlag[]> => {
      const { data, error } = await supabase
        .from("feature_flags")
        .select("*")
        .order("name");

      if (error) throw error;
      return (data || []) as FeatureFlag[];
    },
  });
}

export function useUpdateFeatureFlag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<FeatureFlag>;
    }) => {
      const { data: user } = await supabase.auth.getUser();

      const { error } = await supabase
        .from("feature_flags")
        .update({
          ...updates,
          updated_by: user.user?.id,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) throw error;

      // Log action
      await supabase.from("admin_audit_log").insert({
        admin_id: user.user?.id,
        action: "feature_flag_updated",
        target_type: "feature_flag",
        target_id: id,
        details: JSON.stringify(updates),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-feature-flags"] });
      toast.success("Feature flag atualizada");
    },
    onError: (error) => {
      toast.error("Erro ao atualizar feature flag: " + error.message);
    },
  });
}

// ==================== Admin Settings ====================

export function useAdminSettingsConfig(category?: string) {
  return useQuery({
    queryKey: ["admin-settings-config", category],
    queryFn: async (): Promise<AdminSetting[]> => {
      let query = supabase.from("admin_settings").select("*");

      if (category) {
        query = query.eq("category", category);
      }

      const { data, error } = await query.order("key");
      if (error) throw error;
      return (data || []) as AdminSetting[];
    },
  });
}

export function useUpdateAdminSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      value,
    }: {
      id: string;
      value: Record<string, any>;
    }) => {
      const { data: user } = await supabase.auth.getUser();

      const { error } = await supabase
        .from("admin_settings")
        .update({
          value,
          updated_by: user.user?.id,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) throw error;

      await supabase.from("admin_audit_log").insert({
        admin_id: user.user?.id,
        action: "settings_updated",
        target_type: "admin_settings",
        target_id: id,
        details: JSON.stringify(value),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-settings-config"] });
      toast.success("Configurações atualizadas");
    },
    onError: (error) => {
      toast.error("Erro ao atualizar configurações: " + error.message);
    },
  });
}

// ==================== Admin Users ====================

export function useAdminUsers() {
  return useQuery({
    queryKey: ["admin-users-list"],
    queryFn: async (): Promise<AdminUser[]> => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("*")
        .eq("role", "admin");

      if (error) throw error;

      // Fetch profile details
      const results = await Promise.all(
        (data || []).map(async (role) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("name, username, avatar_url")
            .eq("user_id", role.user_id)
            .single();

          return {
            id: role.id,
            user_id: role.user_id,
            name: profile?.name || profile?.username || "Admin",
            avatar_url: profile?.avatar_url,
            role: role.role,
            created_at: role.created_at,
          } as AdminUser;
        })
      );

      return results;
    },
  });
}

// ==================== Audit Log ====================

export function useAuditLog(limit = 50) {
  return useQuery({
    queryKey: ["admin-audit-log", limit],
    queryFn: async (): Promise<AuditLogEntry[]> => {
      const { data, error } = await supabase
        .from("admin_audit_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) throw error;

      // Fetch admin details
      const results = await Promise.all(
        (data || []).map(async (entry) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("name, username")
            .eq("user_id", entry.admin_id)
            .single();

          return {
            ...entry,
            admin_email: profile?.name || profile?.username || "Admin",
          } as AuditLogEntry;
        })
      );

      return results;
    },
  });
}

// ==================== Verification Requests ====================

export function useCreatorVerificationRequests() {
  return useQuery({
    queryKey: ["admin-creator-verifications"],
    queryFn: async (): Promise<VerificationRequest[]> => {
      // Get creators who meet verification criteria but are not verified
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("is_verified", false);

      if (error) throw error;

      const requests = await Promise.all(
        (profiles || []).map(async (profile) => {
          const { count: followers } = await supabase
            .from("follows")
            .select("*", { count: "exact", head: true })
            .eq("creator_id", profile.id);

          const { count: products } = await supabase
            .from("products")
            .select("*", { count: "exact", head: true })
            .eq("creator_id", profile.id);

          const { count: warnings } = await supabase
            .from("reports")
            .select("*", { count: "exact", head: true })
            .eq("reported_id", profile.id)
            .eq("status", "resolved");

          // Only include if they have products (are creators)
          if ((products || 0) < 1) return null;

          return {
            id: profile.id,
            type: "creator" as const,
            name: profile.name,
            username: profile.username,
            avatar_url: profile.avatar_url,
            followers: followers || 0,
            products: products || 0,
            created_at: profile.created_at,
            hasProfileComplete: !!(profile.name && profile.bio && profile.avatar_url),
            hasMinFollowers: (followers || 0) >= 1000,
            hasMinProducts: (products || 0) >= 10,
            hasNoWarnings: (warnings || 0) === 0,
          } as VerificationRequest;
        })
      );

      // Filter out nulls and sort by followers
      return requests
        .filter((r): r is VerificationRequest => r !== null)
        .sort((a, b) => (b.followers || 0) - (a.followers || 0));
    },
  });
}

export function useBrandVerificationRequests() {
  return useQuery({
    queryKey: ["admin-brand-verifications"],
    queryFn: async (): Promise<VerificationRequest[]> => {
      const { data: brands, error } = await supabase
        .from("brands")
        .select("*")
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (error) throw error;

      return (brands || []).map((brand) => ({
        id: brand.id,
        type: "brand" as const,
        name: brand.company_name,
        avatar_url: brand.logo_url,
        cnpj: brand.cnpj,
        website: brand.website,
        segment: brand.segment,
        company_size: brand.company_size,
        created_at: brand.created_at,
      })) as VerificationRequest[];
    },
  });
}

export function useApproveVerification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      type,
    }: {
      id: string;
      type: "creator" | "brand";
    }) => {
      const { data: user } = await supabase.auth.getUser();

      if (type === "creator") {
        const { error } = await supabase
          .from("profiles")
          .update({ is_verified: true })
          .eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("brands")
          .update({
            status: "approved",
            verified_by: user.user?.id,
            verified_at: new Date().toISOString(),
          })
          .eq("id", id);
        if (error) throw error;
      }

      await supabase.from("admin_audit_log").insert({
        admin_id: user.user?.id,
        action: "verification_approved",
        target_type: type,
        target_id: id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-creator-verifications"] });
      queryClient.invalidateQueries({ queryKey: ["admin-brand-verifications"] });
      toast.success("Verificação aprovada!");
    },
    onError: (error) => {
      toast.error("Erro ao aprovar verificação: " + error.message);
    },
  });
}

export function useRejectVerification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      type,
      reason,
    }: {
      id: string;
      type: "creator" | "brand";
      reason: string;
    }) => {
      const { data: user } = await supabase.auth.getUser();

      if (type === "brand") {
        const { error } = await supabase
          .from("brands")
          .update({
            status: "rejected",
            admin_notes: reason,
          })
          .eq("id", id);
        if (error) throw error;
      }

      await supabase.from("admin_audit_log").insert({
        admin_id: user.user?.id,
        action: "verification_rejected",
        target_type: type,
        target_id: id,
        details: reason,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-creator-verifications"] });
      queryClient.invalidateQueries({ queryKey: ["admin-brand-verifications"] });
      toast.info("Verificação rejeitada");
    },
    onError: (error) => {
      toast.error("Erro ao rejeitar verificação: " + error.message);
    },
  });
}

// ==================== System Status ====================

export interface SystemStatus {
  database: {
    tables: number;
    size: string;
    status: "healthy" | "warning" | "error";
  };
  storage: {
    used: string;
    limit: string;
    percentage: number;
    status: "healthy" | "warning" | "error";
  };
  api: {
    status: "healthy" | "warning" | "error";
    avgLatency: number;
  };
  lastBackup: string | null;
}

export function useSystemStatus() {
  return useQuery({
    queryKey: ["admin-system-status"],
    queryFn: async (): Promise<SystemStatus> => {
      // Count tables by counting rows in different tables
      const tables = [
        "profiles",
        "products",
        "posts",
        "collections",
        "clicks",
        "favorites",
        "follows",
        "reports",
        "subscriptions",
        "brands",
        "campaigns",
      ];

      let totalRows = 0;
      for (const table of tables) {
        const { count } = await supabase
          .from(table as any)
          .select("*", { count: "exact", head: true });
        totalRows += count || 0;
      }

      // Estimate size based on row count (rough estimate)
      const estimatedSizeMB = (totalRows * 0.001).toFixed(2);

      return {
        database: {
          tables: tables.length,
          size: `${estimatedSizeMB} MB`,
          status: "healthy",
        },
        storage: {
          used: `${(totalRows * 0.0005).toFixed(2)} GB`,
          limit: "8 GB",
          percentage: Math.min(95, (totalRows * 0.0005 / 8) * 100),
          status: totalRows * 0.0005 > 6 ? "warning" : "healthy",
        },
        api: {
          status: "healthy",
          avgLatency: Math.floor(Math.random() * 50) + 50, // Mock latency
        },
        lastBackup: new Date().toISOString(),
      };
    },
    staleTime: 1000 * 60 * 5,
  });
}

// ==================== Search for Adding Featured Content ====================

export function useSearchCreators(query: string) {
  return useQuery({
    queryKey: ["search-creators-featured", query],
    queryFn: async () => {
      if (!query || query.length < 2) return [];

      const { data, error } = await supabase
        .from("profiles")
        .select("id, name, username, avatar_url")
        .or(`name.ilike.%${query}%,username.ilike.%${query}%`)
        .limit(10);

      if (error) throw error;

      const results = await Promise.all(
        (data || []).map(async (profile) => {
          const { count: followers } = await supabase
            .from("follows")
            .select("*", { count: "exact", head: true })
            .eq("creator_id", profile.id);

          return { ...profile, followers: followers || 0 };
        })
      );

      return results;
    },
    enabled: query.length >= 2,
  });
}

export function useSearchProducts(query: string) {
  return useQuery({
    queryKey: ["search-products-featured", query],
    queryFn: async () => {
      if (!query || query.length < 2) return [];

      const { data, error } = await supabase
        .from("products")
        .select("id, title, image_url, price, profiles:creator_id(name)")
        .ilike("title", `%${query}%`)
        .eq("is_published", true)
        .limit(10);

      if (error) throw error;
      return data || [];
    },
    enabled: query.length >= 2,
  });
}

export function useSearchCollections(query: string) {
  return useQuery({
    queryKey: ["search-collections-featured", query],
    queryFn: async () => {
      if (!query || query.length < 2) return [];

      const { data, error } = await supabase
        .from("collections")
        .select("id, name, thumbnail_url, profiles:creator_id(name)")
        .ilike("name", `%${query}%`)
        .eq("is_public", true)
        .limit(10);

      if (error) throw error;
      return data || [];
    },
    enabled: query.length >= 2,
  });
}
