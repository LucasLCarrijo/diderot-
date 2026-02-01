import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

type ReportedType = "user" | "product" | "post";
type ReportReason = "spam" | "inappropriate" | "fraud" | "copyright" | "impersonation" | "other";

interface CreateReportParams {
  reportedType: ReportedType;
  reportedId: string;
  reason: ReportReason;
  description?: string;
}

export function useCreateReport() {
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ reportedType, reportedId, reason, description }: CreateReportParams) => {
      if (!user) throw new Error("Você precisa estar logado");

      const { error } = await supabase
        .from("reports")
        .insert({
          reporter_id: user.id,
          reported_type: reportedType,
          reported_id: reportedId,
          reason,
          description,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Denúncia enviada. Vamos analisar em breve.");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao enviar denúncia");
    },
  });
}
