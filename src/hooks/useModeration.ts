import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

export interface Report {
  id: string;
  reported_type: string;
  reported_id: string;
  reason: string;
  description: string | null;
  status: string;
  created_at: string;
  reporter_id: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
}

export interface ModerationAction {
  id: string;
  action_type: string;
  target_type: string;
  target_id: string;
  admin_id: string;
  reason: string | null;
  notes: string | null;
  created_at: string;
  admin?: {
    email?: string;
  };
}

export function useReports(status?: string) {
  return useQuery({
    queryKey: ["admin-reports", status],
    queryFn: async () => {
      let query = supabase
        .from("reports")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (status) {
        query = query.eq("status", status);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as Report[];
    },
  });
}

export function useReportStats() {
  return useQuery({
    queryKey: ["admin-report-stats"],
    queryFn: async () => {
      const { data: reports, error } = await supabase
        .from("reports")
        .select("status, created_at, reviewed_at");

      if (error) throw error;

      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      const pending = reports?.filter((r) => r.status === "pending").length || 0;
      const resolved = reports?.filter(
        (r) =>
          r.status === "resolved" &&
          new Date(r.reviewed_at || r.created_at) >= sevenDaysAgo
      ).length || 0;

      // Calculate average resolution time
      const resolvedWithTime = reports?.filter(
        (r) => r.status === "resolved" && r.reviewed_at
      ) || [];
      
      let avgTime = 0;
      if (resolvedWithTime.length > 0) {
        const totalTime = resolvedWithTime.reduce((acc, r) => {
          const created = new Date(r.created_at).getTime();
          const reviewed = new Date(r.reviewed_at!).getTime();
          return acc + (reviewed - created);
        }, 0);
        avgTime = totalTime / resolvedWithTime.length / (1000 * 60 * 60); // in hours
      }

      return {
        pending,
        resolved,
        avgResolutionTime: avgTime.toFixed(1),
        total: reports?.length || 0,
      };
    },
  });
}

export function useUpdateReportStatus() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      reportId,
      status,
      notes,
    }: {
      reportId: string;
      status: string;
      notes?: string;
    }) => {
      const { error } = await supabase
        .from("reports")
        .update({
          status,
          reviewed_at: new Date().toISOString(),
          reviewed_by: user?.id,
        })
        .eq("id", reportId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-reports"] });
      queryClient.invalidateQueries({ queryKey: ["admin-report-stats"] });
      toast.success("Report atualizado com sucesso");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao atualizar report");
    },
  });
}

export function useModerationActions() {
  return useQuery({
    queryKey: ["admin-moderation-actions"],
    queryFn: async () => {
      // For now, we'll get actions from campaign_history as a proxy
      // In a real app, you'd have a dedicated moderation_actions table
      const { data: reports, error } = await supabase
        .from("reports")
        .select("*")
        .not("status", "eq", "pending")
        .order("reviewed_at", { ascending: false })
        .limit(50);

      if (error) throw error;

      // Transform reports into action log format
      return reports.map((r) => ({
        id: r.id,
        action_type: r.status === "resolved" ? "resolved" : "dismissed",
        target_type: r.reported_type,
        target_id: r.reported_id,
        admin_id: r.reviewed_by || "",
        reason: r.reason,
        notes: r.description,
        created_at: r.reviewed_at || r.created_at,
      })) as ModerationAction[];
    },
  });
}
