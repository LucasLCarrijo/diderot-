import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface AdminProduct {
  id: string;
  title: string;
  slug: string | null;
  image_url: string | null;
  store: string | null;
  price: number | null;
  currency: string | null;
  monetization_type: "affiliate" | "coupon" | "recommendation";
  coupon_code: string | null;
  status: "published" | "draft" | "archived";
  is_published: boolean;
  categories: string[];
  click_count: number;
  favorite_count: number;
  ctr: string;
  description: string | null;
  affiliate_url: string;
  created_at: string;
  updated_at: string;
  profiles: {
    name: string;
    username: string;
    avatar_url: string | null;
  };
}

export interface AdminPost {
  id: string;
  image_url: string;
  title: string | null;
  content: string | null;
  creator: {
    name: string;
    username: string;
    avatar: string | null;
  };
  pins: {
    id: string;
    x: number;
    y: number;
    product: {
      id: string;
      title: string;
      image_url: string | null;
      store: string | null;
      clicks: number;
    };
  }[];
  views: number;
  saves: number;
  clicks: number;
  engagement_rate: number;
  created_at: string;
  hashtags: string[];
  reports: number;
}

export interface AdminCollection {
  id: string;
  name: string;
  thumbnail_url: string | null;
  description: string | null;
  creator: {
    name: string;
    username: string;
    avatar: string | null;
    type: "creator" | "follower";
  };
  products: {
    id: string;
    title: string;
    image_url: string | null;
    clicks: number;
  }[];
  is_public: boolean;
  views: number;
  is_featured: boolean;
  created_at: string;
}

export interface ContentStats {
  products: {
    total: number;
    published: number;
    draft: number;
    archived: number;
    withCoupon: number;
    avgClicks: number;
  };
  posts: {
    total: number;
    withPins: number;
    avgPins: string;
    avgCTR: string;
  };
  collections: {
    total: number;
    creator: number;
    follower: number;
    avgProducts: string;
    featured: number;
  };
}

interface UseAdminProductsOptions {
  search?: string;
  statusFilter?: string;
  typeFilter?: string;
  categoryFilter?: string;
  storeFilter?: string;
  sortBy?: string;
  dateRange?: { from?: Date; to?: Date };
  page?: number;
  pageSize?: number;
}

export function useAdminProducts(options: UseAdminProductsOptions = {}) {
  const {
    search = "",
    statusFilter = "all",
    typeFilter = "all",
    categoryFilter = "all",
    storeFilter = "all",
    sortBy = "recent",
    dateRange,
    page = 1,
    pageSize = 50,
  } = options;

  return useQuery({
    queryKey: [
      "admin-products",
      search,
      statusFilter,
      typeFilter,
      categoryFilter,
      storeFilter,
      sortBy,
      dateRange?.from?.toISOString(),
      dateRange?.to?.toISOString(),
      page,
      pageSize,
    ],
    queryFn: async () => {
      let query = supabase
        .from("products")
        .select(`
          id,
          title,
          slug,
          image_url,
          store,
          price,
          currency,
          monetization_type,
          coupon_code,
          status,
          is_published,
          categories,
          click_count,
          favorite_count,
          description,
          affiliate_url,
          created_at,
          updated_at,
          profiles:creator_id (
            name,
            username,
            avatar_url
          )
        `, { count: "exact" });

      // Search filter
      if (search) {
        query = query.or(`title.ilike.%${search}%,slug.ilike.%${search}%`);
      }

      // Status filter
      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      // Type filter
      if (typeFilter !== "all") {
        query = query.eq("monetization_type", typeFilter);
      }

      // Category filter
      if (categoryFilter !== "all") {
        query = query.contains("categories", [categoryFilter]);
      }

      // Store filter
      if (storeFilter !== "all") {
        query = query.eq("store", storeFilter);
      }

      // Date range filter
      if (dateRange?.from) {
        query = query.gte("created_at", dateRange.from.toISOString());
      }
      if (dateRange?.to) {
        query = query.lte("created_at", dateRange.to.toISOString());
      }

      // Sorting
      switch (sortBy) {
        case "recent":
          query = query.order("created_at", { ascending: false });
          break;
        case "clicks":
          query = query.order("click_count", { ascending: false });
          break;
        case "favorites":
          query = query.order("favorite_count", { ascending: false });
          break;
        case "ctr":
          query = query.order("click_count", { ascending: false });
          break;
        default:
          query = query.order("created_at", { ascending: false });
      }

      // Pagination
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) throw error;

      const products: AdminProduct[] = (data || []).map(p => {
        const impressions = (p.click_count || 0) / 0.045;
        const ctr = impressions > 0 ? ((p.click_count || 0) / impressions * 100).toFixed(2) : "0.00";
        
        return {
          id: p.id,
          title: p.title,
          slug: p.slug,
          image_url: p.image_url,
          store: p.store,
          price: p.price,
          currency: p.currency,
          monetization_type: (p.monetization_type || "affiliate") as AdminProduct["monetization_type"],
          coupon_code: p.coupon_code,
          status: (p.status || "published") as AdminProduct["status"],
          is_published: p.is_published ?? true,
          categories: p.categories || [],
          click_count: p.click_count || 0,
          favorite_count: p.favorite_count || 0,
          ctr,
          description: p.description,
          affiliate_url: p.affiliate_url,
          created_at: p.created_at,
          updated_at: p.updated_at,
          profiles: {
            name: (p.profiles as any)?.name || "Unknown",
            username: (p.profiles as any)?.username || "unknown",
            avatar_url: (p.profiles as any)?.avatar_url || null,
          },
        };
      });

      return {
        products,
        totalCount: count || 0,
        totalPages: Math.ceil((count || 0) / pageSize),
      };
    },
    staleTime: 1000 * 60 * 2,
  });
}

export function useAdminPosts(options: { search?: string; page?: number; pageSize?: number } = {}) {
  const { search = "", page = 1, pageSize = 50 } = options;

  return useQuery({
    queryKey: ["admin-posts", search, page, pageSize],
    queryFn: async () => {
      let query = supabase
        .from("posts")
        .select(`
          id,
          image_url,
          title,
          content,
          created_at,
          profiles:creator_id (
            name,
            username,
            avatar_url
          ),
          post_products (
            id,
            x,
            y,
            product_id,
            products:product_id (
              id,
              title,
              image_url,
              store,
              click_count
            )
          )
        `, { count: "exact" })
        .order("created_at", { ascending: false });

      if (search) {
        query = query.or(`content.ilike.%${search}%,title.ilike.%${search}%`);
      }

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) throw error;

      // Get click counts for posts
      const postIds = data?.map(p => p.id) || [];
      let clickCounts: Record<string, number> = {};
      
      if (postIds.length > 0) {
        const { data: clicks } = await supabase
          .from("clicks")
          .select("post_id")
          .in("post_id", postIds);
        
        clickCounts = (clicks || []).reduce((acc, c) => {
          acc[c.post_id!] = (acc[c.post_id!] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
      }

      const posts: AdminPost[] = (data || []).map(p => {
        const pins = (p.post_products || []).map((pp: any) => ({
          id: pp.id,
          x: pp.x || 0.5,
          y: pp.y || 0.5,
          product: {
            id: pp.products?.id || "",
            title: pp.products?.title || "Unknown",
            image_url: pp.products?.image_url,
            store: pp.products?.store,
            clicks: pp.products?.click_count || 0,
          },
        }));

        const views = Math.floor(Math.random() * 5000) + 500; // Placeholder - would need real view tracking
        const clicks = clickCounts[p.id] || 0;
        const saves = Math.floor(views * 0.08); // Placeholder

        return {
          id: p.id,
          image_url: p.image_url,
          title: p.title,
          content: p.content,
          creator: {
            name: (p.profiles as any)?.name || "Unknown",
            username: (p.profiles as any)?.username || "unknown",
            avatar: (p.profiles as any)?.avatar_url || null,
          },
          pins,
          views,
          saves,
          clicks,
          engagement_rate: views > 0 ? ((saves + clicks) / views) * 100 : 0,
          created_at: p.created_at,
          hashtags: [], // Would need to parse from content
          reports: 0, // Would need to query reports table
        };
      });

      return {
        posts,
        totalCount: count || 0,
        totalPages: Math.ceil((count || 0) / pageSize),
      };
    },
    staleTime: 1000 * 60 * 2,
  });
}

export function useAdminCollections(options: { search?: string; page?: number; pageSize?: number } = {}) {
  const { search = "", page = 1, pageSize = 50 } = options;

  return useQuery({
    queryKey: ["admin-collections", search, page, pageSize],
    queryFn: async () => {
      let query = supabase
        .from("collections")
        .select(`
          id,
          name,
          thumbnail_url,
          description,
          is_public,
          created_at,
          profiles:creator_id (
            name,
            username,
            avatar_url
          )
        `, { count: "exact" })
        .order("created_at", { ascending: false });

      if (search) {
        query = query.ilike("name", `%${search}%`);
      }

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) throw error;

      // Get products for each collection
      const collectionIds = data?.map(c => c.id) || [];
      let productsInCollections: Record<string, any[]> = {};
      
      if (collectionIds.length > 0) {
        const { data: products } = await supabase
          .from("products")
          .select("id, title, image_url, click_count, collection_id")
          .in("collection_id", collectionIds);
        
        productsInCollections = (products || []).reduce((acc, p) => {
          if (p.collection_id) {
            if (!acc[p.collection_id]) acc[p.collection_id] = [];
            acc[p.collection_id].push({
              id: p.id,
              title: p.title,
              image_url: p.image_url,
              clicks: p.click_count || 0,
            });
          }
          return acc;
        }, {} as Record<string, any[]>);
      }

      // Check which collections creators have roles
      const creatorIds = data?.map(c => (c.profiles as any)?.id).filter(Boolean) || [];
      let creatorRoles: Set<string> = new Set();
      
      if (creatorIds.length > 0) {
        const { data: roles } = await supabase
          .from("user_roles")
          .select("user_id")
          .eq("role", "creator");
        
        creatorRoles = new Set((roles || []).map(r => r.user_id));
      }

      const collections: AdminCollection[] = (data || []).map(c => ({
        id: c.id,
        name: c.name,
        thumbnail_url: c.thumbnail_url,
        description: c.description,
        creator: {
          name: (c.profiles as any)?.name || "Unknown",
          username: (c.profiles as any)?.username || "unknown",
          avatar: (c.profiles as any)?.avatar_url || null,
          type: "creator" as const, // Simplified
        },
        products: productsInCollections[c.id] || [],
        is_public: c.is_public ?? true,
        views: Math.floor(Math.random() * 3000) + 100, // Placeholder
        is_featured: false, // Would need a featured flag in DB
        created_at: c.created_at,
      }));

      return {
        collections,
        totalCount: count || 0,
        totalPages: Math.ceil((count || 0) / pageSize),
      };
    },
    staleTime: 1000 * 60 * 2,
  });
}

export function useContentStats() {
  return useQuery({
    queryKey: ["admin-content-stats"],
    queryFn: async () => {
      // Products stats
      const { count: totalProducts } = await supabase
        .from("products")
        .select("*", { count: "exact", head: true });

      const { count: publishedProducts } = await supabase
        .from("products")
        .select("*", { count: "exact", head: true })
        .eq("is_published", true);

      const { count: draftProducts } = await supabase
        .from("products")
        .select("*", { count: "exact", head: true })
        .eq("status", "draft");

      const { count: archivedProducts } = await supabase
        .from("products")
        .select("*", { count: "exact", head: true })
        .eq("status", "archived");

      const { count: productsWithCoupon } = await supabase
        .from("products")
        .select("*", { count: "exact", head: true })
        .eq("monetization_type", "coupon");

      const { data: clickData } = await supabase
        .from("products")
        .select("click_count");
      
      const avgClicks = clickData && clickData.length > 0
        ? Math.round(clickData.reduce((sum, p) => sum + (p.click_count || 0), 0) / clickData.length)
        : 0;

      // Posts stats
      const { count: totalPosts } = await supabase
        .from("posts")
        .select("*", { count: "exact", head: true });

      const { data: postsWithPinsData } = await supabase
        .from("post_products")
        .select("post_id");
      
      const uniquePostsWithPins = new Set((postsWithPinsData || []).map(p => p.post_id)).size;
      const avgPins = (totalPosts || 0) > 0 
        ? ((postsWithPinsData?.length || 0) / (totalPosts || 1)).toFixed(1)
        : "0";

      // Collections stats
      const { count: totalCollections } = await supabase
        .from("collections")
        .select("*", { count: "exact", head: true });

      const { data: productsInCollections } = await supabase
        .from("products")
        .select("collection_id")
        .not("collection_id", "is", null);

      const avgProductsPerCollection = (totalCollections || 0) > 0
        ? ((productsInCollections?.length || 0) / (totalCollections || 1)).toFixed(1)
        : "0";

      // Get unique stores
      const { data: storeData } = await supabase
        .from("products")
        .select("store")
        .not("store", "is", null);
      
      const uniqueStores = [...new Set((storeData || []).map(p => p.store).filter(Boolean))].sort();

      return {
        products: {
          total: totalProducts || 0,
          published: publishedProducts || 0,
          draft: draftProducts || 0,
          archived: archivedProducts || 0,
          withCoupon: productsWithCoupon || 0,
          avgClicks,
        },
        posts: {
          total: totalPosts || 0,
          withPins: uniquePostsWithPins,
          avgPins,
          avgCTR: "4.5", // Would need real impression tracking
        },
        collections: {
          total: totalCollections || 0,
          creator: totalCollections || 0, // Simplified
          follower: 0,
          avgProducts: avgProductsPerCollection,
          featured: 0,
        },
        uniqueStores,
      };
    },
    staleTime: 1000 * 60 * 5,
  });
}
