import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

// Types
export interface Product {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  additional_images: string[] | null;
  affiliate_url: string;
  price: number | null;
  currency: string | null;
  categories: string[] | null;
  is_published: boolean | null;
  click_count: number | null;
  favorite_count: number | null;
  created_at: string;
  updated_at: string;
  slug: string | null;
  store: string | null;
  monetization_type: string | null;
  coupon_code: string | null;
  status: string | null;
  creator_id: string;
}

export interface ProductWithCreator extends Product {
  profiles: {
    id: string;
    name: string;
    username: string;
    avatar_url: string | null;
    bio: string | null;
    is_verified: boolean | null;
  } | null;
}

export interface ProductFormData {
  title: string;
  description?: string;
  image_url?: string;
  additional_images?: string[];
  affiliate_url: string;
  price?: number;
  currency?: string;
  categories?: string[];
  is_published?: boolean;
  store?: string;
  monetization_type?: string;
  coupon_code?: string;
  status?: string;
}

export interface ProductFilters {
  status?: string;
  monetization_type?: string;
  category?: string;
  search?: string;
}

// Get user's profile ID
async function getProfileId(userId: string): Promise<string | null> {
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  return profile?.id ?? null;
}

// Hook: Get my products with filters
export function useMyProducts(filters?: ProductFilters) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["my-products", user?.id, filters],
    queryFn: async () => {
      const profileId = await getProfileId(user!.id);
      if (!profileId) return [];

      let query = supabase
        .from("products")
        .select("*")
        .eq("creator_id", profileId)
        .neq("status", "archived") // Hide archived by default
        .order("created_at", { ascending: false });

      // Apply filters
      if (filters?.status && filters.status !== "all") {
        query = query.eq("status", filters.status);
      }
      if (filters?.monetization_type && filters.monetization_type !== "all") {
        query = query.eq("monetization_type", filters.monetization_type);
      }
      if (filters?.category) {
        query = query.contains("categories", [filters.category]);
      }
      if (filters?.search) {
        query = query.ilike("title", `%${filters.search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Product[];
    },
    enabled: !!user?.id,
  });
}

// Hook: Get single product by ID
export function useProduct(id: string | undefined) {
  return useQuery({
    queryKey: ["product", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("id", id!)
        .maybeSingle();

      if (error) throw error;
      return data as Product | null;
    },
    enabled: !!id,
  });
}

// Hook: Get product by slug with creator info
export function useProductBySlug(slug: string | undefined) {
  return useQuery({
    queryKey: ["product-slug", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select(`
          *,
          profiles:creator_id (
            id,
            name,
            username,
            avatar_url,
            bio,
            is_verified
          )
        `)
        .eq("slug", slug!)
        .eq("is_published", true)
        .maybeSingle();

      if (error) throw error;
      return data as ProductWithCreator | null;
    },
    enabled: !!slug,
  });
}

// Hook: Get product stats
export function useProductStats() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["product-stats", user?.id],
    queryFn: async () => {
      const profileId = await getProfileId(user!.id);
      if (!profileId) return { total: 0, clicks: 0, favorites: 0 };

      const { data, error } = await supabase
        .from("products")
        .select("id, click_count, favorite_count, status")
        .eq("creator_id", profileId)
        .neq("status", "archived");

      if (error) throw error;

      const products = data || [];
      return {
        total: products.length,
        clicks: products.reduce((sum, p) => sum + (p.click_count || 0), 0),
        favorites: products.reduce((sum, p) => sum + (p.favorite_count || 0), 0),
      };
    },
    enabled: !!user?.id,
  });
}

// Hook: Get related products
export function useRelatedProducts(productId: string, creatorId: string, categories: string[] | null) {
  return useQuery({
    queryKey: ["related-products", productId, creatorId],
    queryFn: async () => {
      // First try same creator's products
      const { data: creatorProducts, error } = await supabase
        .from("products")
        .select("*")
        .eq("creator_id", creatorId)
        .eq("is_published", true)
        .neq("id", productId)
        .limit(4);

      if (error) throw error;
      return creatorProducts as Product[];
    },
    enabled: !!productId && !!creatorId,
  });
}

// Hook: Create product
export function useCreateProduct() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: ProductFormData) => {
      const profileId = await getProfileId(user!.id);
      if (!profileId) throw new Error("Perfil não encontrado. Complete seu cadastro primeiro.");

      const { data: product, error } = await supabase
        .from("products")
        .insert({
          ...data,
          creator_id: profileId,
          status: data.status || "published",
          monetization_type: data.monetization_type || "affiliate",
        })
        .select()
        .single();

      if (error) throw error;
      return product;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-products"] });
      queryClient.invalidateQueries({ queryKey: ["product-stats"] });
      toast.success("Produto criado com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao criar produto");
    },
  });
}

// Hook: Update product
export function useUpdateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ProductFormData> }) => {
      const { data: product, error } = await supabase
        .from("products")
        .update({
          ...data,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return product;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["my-products"] });
      queryClient.invalidateQueries({ queryKey: ["product", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["product-stats"] });
      toast.success("Produto atualizado!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao atualizar produto");
    },
  });
}

// Hook: Delete product (soft delete)
export function useDeleteProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("products")
        .update({ status: "archived" })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-products"] });
      queryClient.invalidateQueries({ queryKey: ["product-stats"] });
      toast.success("Produto arquivado!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao arquivar produto");
    },
  });
}

// Hook: Increment view/click count
export function useTrackProductClick() {
  return useMutation({
    mutationFn: async (productId: string) => {
      // Record the click for analytics
      const { error: clickError } = await supabase
        .from("clicks")
        .insert({
          product_id: productId,
          user_agent: navigator.userAgent,
          referrer: document.referrer || null,
        });

      if (clickError) console.error("Error recording click:", clickError);
    },
  });
}
