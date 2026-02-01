import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useFeed() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["feed", user?.id],
    queryFn: async () => {
      // Get IDs of creators the user follows
      let followedCreatorIds: string[] = [];
      
      if (user) {
        const { data: follows } = await supabase
          .from("follows")
          .select("creator_id")
          .eq("follower_id", user.id);
        
        followedCreatorIds = (follows || []).map((f) => f.creator_id);
      }

      // Get products from followed creators first, then popular products
      let query = supabase
        .from("products")
        .select(`
          id,
          title,
          image_url,
          affiliate_url,
          price,
          currency,
          categories,
          click_count,
          favorite_count,
          created_at,
          slug,
          profiles:creator_id (
            id,
            username,
            name,
            avatar_url,
            is_verified
          )
        `)
        .eq("is_published", true)
        .order("created_at", { ascending: false })
        .limit(50);

      const { data, error } = await query;

      if (error) throw error;

      // Sort: followed creators first, then by recency
      const products = (data || []).map((p) => ({
        ...p,
        creator: p.profiles,
        isFromFollowed: followedCreatorIds.includes((p.profiles as { id: string })?.id),
      }));

      // Sort followed first, then by date
      products.sort((a, b) => {
        if (a.isFromFollowed && !b.isFromFollowed) return -1;
        if (!a.isFromFollowed && b.isFromFollowed) return 1;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });

      return products;
    },
  });
}
