import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface UserProfile {
  id: string;
  user_id: string | null;
  username: string;
  name: string;
  bio: string | null;
  avatar_url: string | null;
  instagram_url: string | null;
  tiktok_url: string | null;
  youtube_url: string | null;
  website_url: string | null;
  is_verified: boolean | null;
  created_at: string;
  updated_at: string;
}

export function useMyProfile() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["my-profile", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)  // ✅ FIX: profiles uses 'id', not 'user_id'
        .maybeSingle();

      if (error) throw error;
      return data as UserProfile | null;
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 2, // Cache for 2 minutes
    gcTime: 1000 * 60 * 5, // Keep in cache for 5 minutes
  });
}

export function useUpdateProfile() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<Omit<UserProfile, "id" | "user_id" | "created_at" | "updated_at">>) => {
      if (!user?.id) throw new Error("User not authenticated");

      // Check if profile exists
      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", user.id)  // ✅ FIX: profiles uses 'id', not 'user_id'
        .maybeSingle();

      if (existingProfile) {
        // Update existing profile
        const { data: profile, error } = await supabase
          .from("profiles")
          .update(data)
          .eq("id", user.id)  // ✅ FIX: profiles uses 'id', not 'user_id'
          .select()
          .single();

        if (error) throw error;
        return profile;
      } else {
        // Create new profile (this should rarely happen due to trigger)
        const { data: profile, error } = await supabase
          .from("profiles")
          .insert({
            id: user.id,  // ✅ FIX: Set id explicitly
            username: data.username || user.email?.split("@")[0] || "user",
            name: data.name || user.user_metadata?.name || "Usuário",
            ...data,
          })
          .select()
          .single();

        if (error) throw error;
        return profile;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-profile"] });
      toast.success("Perfil atualizado!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao atualizar perfil");
    },
  });
}
