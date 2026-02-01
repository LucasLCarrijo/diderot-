import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export function useFavorites() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["favorites", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("favorites")
        .select(`
          id,
          product_id,
          created_at,
          products:product_id (
            id,
            title,
            image_url,
            affiliate_url,
            price,
            currency,
            categories,
            slug,
            creator_id,
            profiles:creator_id (
              id,
              username,
              name,
              avatar_url
            )
          )
        `)
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });
}

export function useIsFavorite(productId: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["is-favorite", productId, user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("favorites")
        .select("id")
        .eq("user_id", user!.id)
        .eq("product_id", productId)
        .maybeSingle();

      if (error) throw error;
      return !!data;
    },
    enabled: !!user?.id && !!productId,
  });
}

export function useToggleFavorite() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ productId, isFavorite }: { productId: string; isFavorite: boolean }) => {
      if (!user) throw new Error("Você precisa estar logado");

      if (isFavorite) {
        // Remove from favorites
        const { error } = await supabase
          .from("favorites")
          .delete()
          .eq("user_id", user.id)
          .eq("product_id", productId);

        if (error) throw error;
      } else {
        // Add to favorites
        const { error } = await supabase
          .from("favorites")
          .insert({ user_id: user.id, product_id: productId });

        if (error) throw error;
      }
    },
    onSuccess: (_, { productId, isFavorite }) => {
      queryClient.invalidateQueries({ queryKey: ["favorites"] });
      queryClient.invalidateQueries({ queryKey: ["is-favorite", productId] });
      toast.success(isFavorite ? "Removido dos favoritos" : "Adicionado aos favoritos");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao atualizar favoritos");
    },
  });
}
