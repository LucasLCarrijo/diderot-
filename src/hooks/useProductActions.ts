import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Product, ProductFormData } from "./useCreatorProducts";

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

// Hook: Bulk update products (publish/archive)
export function useBulkUpdateProducts() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      ids,
      data,
    }: {
      ids: string[];
      data: Partial<Pick<Product, "status" | "is_published">>;
    }) => {
      const { error } = await supabase
        .from("products")
        .update({
          ...data,
          updated_at: new Date().toISOString(),
        })
        .in("id", ids);

      if (error) throw error;
      return ids.length;
    },
    onSuccess: (count, { data }) => {
      queryClient.invalidateQueries({ queryKey: ["my-products"] });
      queryClient.invalidateQueries({ queryKey: ["product-stats"] });

      const action =
        data.status === "archived"
          ? "arquivados"
          : data.is_published
          ? "publicados"
          : "atualizados";
      toast.success(`${count} produtos ${action}!`);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao atualizar produtos");
    },
  });
}

// Hook: Duplicate product
export function useDuplicateProduct() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (productId: string) => {
      const profileId = await getProfileId(user!.id);
      if (!profileId) throw new Error("Perfil não encontrado");

      // Fetch original product
      const { data: original, error: fetchError } = await supabase
        .from("products")
        .select("*")
        .eq("id", productId)
        .single();

      if (fetchError) throw fetchError;
      if (!original) throw new Error("Produto não encontrado");

      // Create duplicate
      const { id, slug, created_at, updated_at, click_count, favorite_count, ...productData } =
        original;

      const { data: newProduct, error: createError } = await supabase
        .from("products")
        .insert({
          ...productData,
          title: `${original.title} (Cópia)`,
          status: "draft",
          is_published: false,
          click_count: 0,
          favorite_count: 0,
        })
        .select()
        .single();

      if (createError) throw createError;
      return newProduct;
    },
    onSuccess: (product) => {
      queryClient.invalidateQueries({ queryKey: ["my-products"] });
      queryClient.invalidateQueries({ queryKey: ["product-stats"] });
      toast.success("Produto duplicado! Editando cópia...");
      return product;
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao duplicar produto");
    },
  });
}

// Hook: Get unique stores used by creator
export function useCreatorStores() {
  const { user } = useAuth();

  return useMutation({
    mutationFn: async () => {
      const profileId = await getProfileId(user!.id);
      if (!profileId) return [];

      const { data, error } = await supabase
        .from("products")
        .select("store")
        .eq("creator_id", profileId)
        .not("store", "is", null);

      if (error) throw error;

      // Get unique stores
      const stores = [...new Set(data.map((p) => p.store).filter(Boolean))] as string[];
      return stores;
    },
  });
}

// Hook: Export products to CSV
export function useExportProducts() {
  const { user } = useAuth();

  return useMutation({
    mutationFn: async () => {
      const profileId = await getProfileId(user!.id);
      if (!profileId) throw new Error("Perfil não encontrado");

      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("creator_id", profileId)
        .neq("status", "archived")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Generate CSV
      const headers = [
        "Título",
        "Loja",
        "URL",
        "Tipo",
        "Preço",
        "Categorias",
        "Favoritos",
        "Cliques",
        "Status",
        "Data de Criação",
      ];

      const rows = data.map((p) => [
        `"${(p.title || "").replace(/"/g, '""')}"`,
        `"${(p.store || "").replace(/"/g, '""')}"`,
        `"${p.affiliate_url}"`,
        p.monetization_type || "affiliate",
        p.price ? `${p.currency || "BRL"} ${p.price}` : "",
        `"${(p.categories || []).join(", ")}"`,
        p.favorite_count || 0,
        p.click_count || 0,
        p.status || "published",
        new Date(p.created_at).toLocaleDateString("pt-BR"),
      ]);

      const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

      // Download
      const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `produtos-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      return data.length;
    },
    onSuccess: (count) => {
      toast.success(`${count} produtos exportados!`);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao exportar produtos");
    },
  });
}

// Hook: Get product count for limit checking
export function useProductCount() {
  const { user } = useAuth();

  return useMutation({
    mutationFn: async () => {
      const profileId = await getProfileId(user!.id);
      if (!profileId) return 0;

      const { count, error } = await supabase
        .from("products")
        .select("id", { count: "exact", head: true })
        .eq("creator_id", profileId)
        .neq("status", "archived");

      if (error) throw error;
      return count || 0;
    },
  });
}
