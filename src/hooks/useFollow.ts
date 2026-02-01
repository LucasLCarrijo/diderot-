import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export function useIsFollowing(creatorId: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["is-following", creatorId, user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("follows")
        .select("id")
        .eq("follower_id", user!.id)
        .eq("creator_id", creatorId!)
        .maybeSingle();

      if (error) throw error;
      return !!data;
    },
    enabled: !!user?.id && !!creatorId,
  });
}

export function useFollowing() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["following", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("follows")
        .select(`
          id,
          creator_id,
          created_at,
          profiles:creator_id (
            id,
            username,
            name,
            avatar_url,
            bio
          )
        `)
        .eq("follower_id", user!.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });
}

export function useToggleFollow() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ creatorId, isFollowing }: { creatorId: string; isFollowing: boolean }) => {
      if (!user) throw new Error("Você precisa estar logado");

      if (isFollowing) {
        // Unfollow
        const { error } = await supabase
          .from("follows")
          .delete()
          .eq("follower_id", user.id)
          .eq("creator_id", creatorId);

        if (error) throw error;
      } else {
        // Follow
        const { error } = await supabase
          .from("follows")
          .insert({ follower_id: user.id, creator_id: creatorId });

        if (error) throw error;
      }
    },
    onSuccess: (_, { creatorId, isFollowing }) => {
      queryClient.invalidateQueries({ queryKey: ["following"] });
      queryClient.invalidateQueries({ queryKey: ["is-following", creatorId] });
      queryClient.invalidateQueries({ queryKey: ["creator-follower-count", creatorId] });
      toast.success(isFollowing ? "Deixou de seguir" : "Seguindo!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao atualizar");
    },
  });
}
