import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useCreatorProfile(username: string) {
  return useQuery({
    queryKey: ["creator-profile", username],
    queryFn: async () => {
      // Select only public fields - exclude user_id for security
      const { data, error } = await supabase
        .from("profiles")
        .select("id, name, username, bio, avatar_url, instagram_url, tiktok_url, youtube_url, website_url, is_verified, categories, created_at, updated_at")
        .eq("username", username)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!username,
  });
}

export function useCreatorProducts(creatorId: string | undefined) {
  return useQuery({
    queryKey: ["creator-products", creatorId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("creator_id", creatorId)
        .eq("is_published", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!creatorId,
  });
}

export function useCreatorCollections(creatorId: string | undefined) {
  return useQuery({
    queryKey: ["creator-collections", creatorId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("collections")
        .select(`
          *,
          products:products(count)
        `)
        .eq("creator_id", creatorId)
        .eq("is_public", true)
        .order("updated_at", { ascending: false });

      if (error) throw error;

      return (data || []).map((collection) => ({
        ...collection,
        product_count: Array.isArray(collection.products) 
          ? collection.products[0]?.count || 0 
          : 0,
      }));
    },
    enabled: !!creatorId,
  });
}

export function useCreatorPosts(creatorId: string | undefined) {
  return useQuery({
    queryKey: ["creator-posts", creatorId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("posts")
        .select(`
          *,
          post_products:post_products(count)
        `)
        .eq("creator_id", creatorId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      return (data || []).map((post) => ({
        ...post,
        product_count: Array.isArray(post.post_products) 
          ? post.post_products[0]?.count || 0 
          : 0,
      }));
    },
    enabled: !!creatorId,
  });
}

export function useCreatorFollowerCount(creatorId: string | undefined) {
  return useQuery({
    queryKey: ["creator-follower-count", creatorId],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("follows")
        .select("*", { count: "exact", head: true })
        .eq("creator_id", creatorId);

      if (error) throw error;
      return count || 0;
    },
    enabled: !!creatorId,
  });
}
