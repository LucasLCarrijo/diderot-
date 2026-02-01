import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Brand {
  id: string;
  user_id: string;
  company_name: string;
  legal_name: string | null;
  cnpj: string;
  website: string | null;
  logo_url: string | null;
  segment: string | null;
  company_size: string | null;
  status: string;
  verified_at: string | null;
  verified_by: string | null;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
  // Computed fields
  total_campaigns?: number;
  active_campaigns?: number;
  total_budget?: number;
}

export interface Campaign {
  id: string;
  brand_id: string;
  title: string;
  description: string | null;
  briefing: string | null;
  budget: number;
  start_date: string | null;
  end_date: string | null;
  categories: string[];
  min_followers: number | null;
  status: string;
  requirements: string | null;
  assets: string[];
  impressions: number;
  clicks: number;
  conversions: number;
  created_at: string;
  updated_at: string;
  // Joined fields
  brand?: Brand;
  creators_applied?: number;
  creators_approved?: number;
  deliverables_completed?: number;
  deliverables_total?: number;
}

export interface CampaignApplication {
  id: string;
  campaign_id: string;
  creator_id: string;
  message: string | null;
  proposed_deliverables: string | null;
  proposed_fee: number;
  status: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  created_at: string;
  // Joined fields
  campaign?: Campaign;
  creator?: {
    id: string;
    name: string;
    username: string;
    avatar_url: string | null;
  };
}

export interface CampaignHistory {
  id: string;
  event_type: string;
  description: string;
  brand_id: string | null;
  campaign_id: string | null;
  amount: number | null;
  metadata: Record<string, unknown>;
  created_at: string;
  // Joined fields
  brand?: Brand;
}

export function useBrands() {
  return useQuery({
    queryKey: ["admin-brands"],
    queryFn: async () => {
      const { data: brands, error } = await supabase
        .from("brands")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Get campaign counts for each brand
      const { data: campaigns } = await supabase
        .from("campaigns")
        .select("brand_id, status, budget");

      const brandsWithStats = (brands || []).map((brand) => {
        const brandCampaigns = campaigns?.filter((c) => c.brand_id === brand.id) || [];
        return {
          ...brand,
          total_campaigns: brandCampaigns.length,
          active_campaigns: brandCampaigns.filter((c) => c.status === "active").length,
          total_budget: brandCampaigns.reduce((sum, c) => sum + (c.budget || 0), 0),
        };
      });

      return brandsWithStats as Brand[];
    },
  });
}

export function useCampaigns(status?: string) {
  return useQuery({
    queryKey: ["admin-campaigns", status],
    queryFn: async () => {
      let query = supabase
        .from("campaigns")
        .select(`
          *,
          brand:brands(*)
        `)
        .order("created_at", { ascending: false });

      if (status && status !== "all") {
        query = query.eq("status", status);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Get application counts for each campaign
      const { data: applications } = await supabase
        .from("campaign_applications")
        .select("campaign_id, status");

      const campaignsWithStats = (data || []).map((campaign) => {
        const campaignApps = applications?.filter((a) => a.campaign_id === campaign.id) || [];
        return {
          ...campaign,
          creators_applied: campaignApps.length,
          creators_approved: campaignApps.filter((a) => a.status === "approved").length,
          // Mock deliverables for now
          deliverables_completed: Math.floor(Math.random() * 10),
          deliverables_total: 10 + Math.floor(Math.random() * 5),
        };
      });

      return campaignsWithStats as Campaign[];
    },
  });
}

export function useCampaignApplications(status?: string) {
  return useQuery({
    queryKey: ["admin-campaign-applications", status],
    queryFn: async () => {
      let query = supabase
        .from("campaign_applications")
        .select(`
          *,
          campaign:campaigns(*, brand:brands(*)),
          creator:profiles(id, name, username, avatar_url)
        `)
        .order("created_at", { ascending: false });

      if (status && status !== "all") {
        query = query.eq("status", status);
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data || []) as CampaignApplication[];
    },
  });
}

export function useCampaignHistory(eventType?: string) {
  return useQuery({
    queryKey: ["admin-campaign-history", eventType],
    queryFn: async () => {
      let query = supabase
        .from("campaign_history")
        .select(`
          *,
          brand:brands(company_name)
        `)
        .order("created_at", { ascending: false })
        .limit(100);

      if (eventType && eventType !== "all") {
        query = query.eq("event_type", eventType);
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data || []) as CampaignHistory[];
    },
  });
}

export function useUpdateBrandStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ brandId, status }: { brandId: string; status: string }) => {
      const updates: Record<string, unknown> = { status };
      
      if (status === "verified") {
        updates.verified_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from("brands")
        .update(updates)
        .eq("id", brandId);

      if (error) throw error;

      // Log to history
      await supabase.from("campaign_history").insert({
        event_type: status === "verified" ? "brand_verified" : "brand_suspended",
        description: `Brand ${status === "verified" ? "verificada" : "suspensa"}`,
        brand_id: brandId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-brands"] });
      queryClient.invalidateQueries({ queryKey: ["admin-campaign-history"] });
      toast.success("Status da brand atualizado");
    },
    onError: (error) => {
      toast.error("Erro ao atualizar brand: " + error.message);
    },
  });
}

export function useUpdateApplicationStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ applicationId, status }: { applicationId: string; status: string }) => {
      const { error } = await supabase
        .from("campaign_applications")
        .update({
          status,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", applicationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-campaign-applications"] });
      queryClient.invalidateQueries({ queryKey: ["admin-campaigns"] });
      toast.success("Aplicação atualizada");
    },
    onError: (error) => {
      toast.error("Erro ao atualizar aplicação: " + error.message);
    },
  });
}
