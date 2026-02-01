import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { FeedFiltersState } from "@/components/feed/FeedFilters";

interface FeedProduct {
  id: string;
  title: string;
  image_url: string | null;
  affiliate_url: string;
  price: number | null;
  currency: string | null;
  categories: string[] | null;
  click_count: number | null;
  favorite_count: number | null;
  created_at: string;
  coupon_code: string | null;
  store: string | null;
  slug: string | null;
  creator: {
    id: string;
    username: string;
    name: string;
    avatar_url: string | null;
    is_verified: boolean | null;
  };
  isFromFollowed?: boolean;
  isNew?: boolean;
  isTrending?: boolean;
}

type FeedTab = "for_you" | "following" | "trending";

export function useAdvancedFeed(tab: FeedTab, filters: FeedFiltersState) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["advanced-feed", tab, user?.id, filters],
    queryFn: async (): Promise<FeedProduct[]> => {
      // Get followed creator IDs
      let followedCreatorIds: string[] = [];
      if (user) {
        const { data: follows } = await supabase
          .from("follows")
          .select("creator_id")
          .eq("follower_id", user.id);
        followedCreatorIds = (follows || []).map((f) => f.creator_id);
      }

      // Get user's favorite categories (for personalization)
      let userCategories: string[] = [];
      if (user) {
        const { data: favorites } = await supabase
          .from("favorites")
          .select("products(categories)")
          .eq("user_id", user.id)
          .limit(50);

        if (favorites) {
          const allCategories = favorites
            .map((f) => (f.products as { categories: string[] | null })?.categories || [])
            .flat();
          // Get most common categories
          const categoryCount: Record<string, number> = {};
          allCategories.forEach((cat) => {
            categoryCount[cat] = (categoryCount[cat] || 0) + 1;
          });
          userCategories = Object.entries(categoryCount)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([cat]) => cat);
        }
      }

      // Build base query
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
          coupon_code,
          store,
          slug,
          profiles:creator_id (
            id,
            username,
            name,
            avatar_url,
            is_verified
          )
        `)
        .eq("is_published", true);

      // Apply filters
      if (filters.hasCoupon) {
        query = query.not("coupon_code", "is", null);
      }

      if (filters.priceRange[0] > 0) {
        query = query.gte("price", filters.priceRange[0]);
      }

      if (filters.priceRange[1] < 10000) {
        query = query.lte("price", filters.priceRange[1]);
      }

      // Category filtering
      if (filters.categories.length > 0) {
        query = query.overlaps("categories", filters.categories);
      }

      // Store filtering
      if (filters.stores.length > 0) {
        query = query.in("store", filters.stores);
      }

      // Tab-specific filtering
      if (tab === "following" && followedCreatorIds.length > 0) {
        query = query.in("creator_id", followedCreatorIds);
      }

      // Sorting
      switch (filters.sortBy) {
        case "popular":
          query = query.order("favorite_count", { ascending: false, nullsFirst: false });
          break;
        case "price_asc":
          query = query.order("price", { ascending: true, nullsFirst: false });
          break;
        case "price_desc":
          query = query.order("price", { ascending: false, nullsFirst: false });
          break;
        case "trending":
        case "recent":
        default:
          query = query.order("created_at", { ascending: false });
      }

      query = query.limit(100);

      const { data, error } = await query;
      if (error) throw error;

      let products: FeedProduct[] = (data || []).map((p) => ({
        ...p,
        creator: p.profiles as FeedProduct["creator"],
        isFromFollowed: followedCreatorIds.includes((p.profiles as { id: string })?.id),
        isNew: new Date(p.created_at) > new Date(Date.now() - 24 * 60 * 60 * 1000),
      }));

      // Apply tab-specific logic
      if (tab === "for_you") {
        // Score-based sorting for "For You"
        products = products.map((product) => {
          let score = 0;

          // Followed creator bonus
          if (product.isFromFollowed) score += 50;

          // Category match bonus
          if (
            userCategories.length > 0 &&
            product.categories?.some((c) => userCategories.includes(c))
          ) {
            score += 30;
          }

          // Recency bonus (products in last 7 days)
          const daysOld =
            (Date.now() - new Date(product.created_at).getTime()) /
            (1000 * 60 * 60 * 24);
          if (daysOld < 7) {
            score += Math.max(0, 20 - daysOld * 3);
          }

          // Popularity bonus
          score +=
            Math.min(20, ((product.favorite_count || 0) + (product.click_count || 0)) / 10);

          return { ...product, _score: score };
        });

        // Sort by score, then shuffle slightly for variety
        products.sort((a, b) => {
          const aScore = (a as FeedProduct & { _score: number })._score || 0;
          const bScore = (b as FeedProduct & { _score: number })._score || 0;
          return bScore - aScore;
        });
      } else if (tab === "trending") {
        // Calculate trending score
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

        products = products
          .filter((p) => new Date(p.created_at) > sevenDaysAgo)
          .map((product) => {
            const daysOld = Math.max(
              1,
              (Date.now() - new Date(product.created_at).getTime()) /
                (1000 * 60 * 60 * 24)
            );
            const interactions =
              (product.favorite_count || 0) + (product.click_count || 0);
            const trendingScore = interactions / daysOld;
            return { ...product, isTrending: true, _trendingScore: trendingScore };
          })
          .filter(
            (p) =>
              (p.favorite_count || 0) + (p.click_count || 0) >= 5 // Min interactions
          )
          .sort((a, b) => {
            const aScore = (a as FeedProduct & { _trendingScore: number })._trendingScore || 0;
            const bScore = (b as FeedProduct & { _trendingScore: number })._trendingScore || 0;
            return bScore - aScore;
          });
      }

      // Remove duplicates and limit
      const seen = new Set<string>();
      return products
        .filter((p) => {
          if (seen.has(p.id)) return false;
          seen.add(p.id);
          return true;
        })
        .slice(0, 50);
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
