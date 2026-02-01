import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface SearchResult {
  products: Array<{
    id: string;
    title: string;
    image_url: string | null;
    price: number | null;
    currency: string | null;
    slug: string | null;
    creator: {
      id: string;
      username: string;
      name: string;
    };
  }>;
  creators: Array<{
    id: string;
    username: string;
    name: string;
    avatar_url: string | null;
    bio: string | null;
  }>;
}

export function useSearch(query: string) {
  return useQuery({
    queryKey: ["search", query],
    queryFn: async (): Promise<SearchResult> => {
      if (!query || query.length < 2) {
        return { products: [], creators: [] };
      }

      const searchTerm = `%${query}%`;

      // Search products
      const { data: products, error: productsError } = await supabase
        .from("products")
        .select(`
          id,
          title,
          image_url,
          price,
          currency,
          slug,
          profiles:creator_id (
            id,
            username,
            name
          )
        `)
        .eq("is_published", true)
        .ilike("title", searchTerm)
        .limit(5);

      if (productsError) throw productsError;

      // Search creators - only public fields
      const { data: creators, error: creatorsError } = await supabase
        .from("profiles")
        .select("id, username, name, avatar_url, bio")
        .or(`username.ilike.${searchTerm},name.ilike.${searchTerm}`)
        .limit(5);

      if (creatorsError) throw creatorsError;

      return {
        products: (products || []).map((p) => ({
          id: p.id,
          title: p.title,
          image_url: p.image_url,
          price: p.price,
          currency: p.currency,
          slug: p.slug,
          creator: p.profiles as { id: string; username: string; name: string },
        })),
        creators: creators || [],
      };
    },
    enabled: query.length >= 2,
    staleTime: 1000 * 60, // 1 minute
  });
}
