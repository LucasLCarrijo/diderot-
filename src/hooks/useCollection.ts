import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useCollection(collectionId: string) {
  return useQuery({
    queryKey: ["collection", collectionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("collections")
        .select(`
          *,
          profiles:creator_id (
            id,
            username,
            name,
            avatar_url
          )
        `)
        .eq("id", collectionId)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!collectionId,
  });
}

export function useCollectionProducts(collectionId: string | undefined) {
  return useQuery({
    queryKey: ["collection-products", collectionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("collection_id", collectionId)
        .eq("is_published", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!collectionId,
  });
}
