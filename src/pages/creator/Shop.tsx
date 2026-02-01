import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Plus,
  Package,
  LayoutGrid,
  List,
  MousePointerClick,
  Heart,
  Download,
  Copy,
  SlidersHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { CreatorLayout } from "@/components/layout/CreatorLayout";
import { ProductCard, ProductCardData } from "@/components/creator/ProductCard";
import { ProductForm } from "@/components/creator/ProductForm";
import { ProductFilters } from "@/components/creator/ProductFilters";
import { BulkActionsBar } from "@/components/creator/BulkActionsBar";
import { ProductLimitBanner } from "@/components/creator/ProductLimitBanner";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { useProductFilters, ExtendedProductFilters } from "@/hooks/useProductFilters";
import {
  useBulkUpdateProducts,
  useDuplicateProduct,
  useExportProducts,
} from "@/hooks/useProductActions";
import {
  useMyProducts,
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
  useProductStats,
  Product,
  ProductFormData,
} from "@/hooks/useCreatorProducts";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useCreatorLimits } from "@/hooks/useCreatorLimits";
import { useQuery } from "@tanstack/react-query";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { toast } from "sonner";

export default function Shop() {
  const { loading } = useRequireAuth("creator");
  const { user } = useAuth();
  const { productLimit, hasCreatorPro } = useCreatorLimits();
  const navigate = useNavigate();

  // State
  const [formOpen, setFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // URL-synced filters
  const {
    filters,
    rawFilters,
    setFilter,
    toggleArrayFilter,
    clearFilters,
    hasActiveFilters,
    activeFilterCount,
  } = useProductFilters();

  // Convert extended filters to simple filters for the hook
  const simpleFilters = useMemo(() => {
    const result: {
      status?: string;
      monetization_type?: string;
      category?: string;
      search?: string;
    } = {};

    if (filters.search) result.search = filters.search;
    if (filters.status?.length === 1) result.status = filters.status[0];
    if (filters.monetization_type?.length === 1)
      result.monetization_type = filters.monetization_type[0];
    if (filters.categories?.length === 1) result.category = filters.categories[0];

    return result;
  }, [filters]);

  // Queries & mutations
  const { data: products, isLoading } = useMyProducts(simpleFilters);
  const { data: stats, isLoading: statsLoading } = useProductStats();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();
  const bulkUpdate = useBulkUpdateProducts();
  const duplicateProduct = useDuplicateProduct();
  const exportProducts = useExportProducts();

  // Fetch unique stores
  const { data: stores = [] } = useQuery({
    queryKey: ["creator-stores", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();
      if (!profile) return [];

      const { data } = await supabase
        .from("products")
        .select("store")
        .eq("creator_id", profile.id)
        .not("store", "is", null);

      return [...new Set((data || []).map((p) => p.store).filter(Boolean))] as string[];
    },
    enabled: !!user?.id,
  });

  // Filter products client-side for extended filters
  const filteredProducts = useMemo(() => {
    if (!products) return [];

    return products.filter((p) => {
      // Status filter (multiple)
      if (filters.status?.length && !filters.status.includes(p.status || "published")) {
        return false;
      }

      // Monetization type filter (multiple)
      if (
        filters.monetization_type?.length &&
        !filters.monetization_type.includes(p.monetization_type || "affiliate")
      ) {
        return false;
      }

      // Categories filter (multiple)
      if (filters.categories?.length) {
        const productCategories = p.categories || [];
        if (!filters.categories.some((c) => productCategories.includes(c))) {
          return false;
        }
      }

      // Store filter
      if (filters.store && p.store !== filters.store) {
        return false;
      }

      // Has coupon filter
      if (filters.has_coupon && !p.coupon_code) {
        return false;
      }

      // Price range
      if (filters.price_min !== undefined && (p.price || 0) < filters.price_min) {
        return false;
      }
      if (filters.price_max !== undefined && (p.price || 0) > filters.price_max) {
        return false;
      }

      return true;
    });
  }, [products, filters]);

  // Sort products
  const sortedProducts = useMemo(() => {
    const sorted = [...filteredProducts];
    const sortBy = filters.sort_by || "created_at";
    const order = filters.sort_order || "desc";

    sorted.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case "created_at":
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
        case "click_count":
          comparison = (a.click_count || 0) - (b.click_count || 0);
          break;
        case "favorite_count":
          comparison = (a.favorite_count || 0) - (b.favorite_count || 0);
          break;
        case "title":
          comparison = a.title.localeCompare(b.title);
          break;
      }
      return order === "desc" ? -comparison : comparison;
    });

    return sorted;
  }, [filteredProducts, filters.sort_by, filters.sort_order]);

  // Selection handlers
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectAll = () => {
    setSelectedIds(new Set(sortedProducts.map((p) => p.id)));
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
  };

  // Bulk actions
  const handleBulkPublish = () => {
    bulkUpdate.mutate(
      { ids: Array.from(selectedIds), data: { status: "published", is_published: true } },
      { onSuccess: () => clearSelection() }
    );
  };

  const handleBulkUnpublish = () => {
    bulkUpdate.mutate(
      { ids: Array.from(selectedIds), data: { status: "draft", is_published: false } },
      { onSuccess: () => clearSelection() }
    );
  };

  const handleBulkArchive = () => {
    bulkUpdate.mutate(
      { ids: Array.from(selectedIds), data: { status: "archived", is_published: false } },
      { onSuccess: () => clearSelection() }
    );
  };

  // Product actions
  const handleCreate = (data: ProductFormData) => {
    createProduct.mutate(data, {
      onSuccess: () => {
        setFormOpen(false);
      },
    });
  };

  const handleUpdate = (data: ProductFormData) => {
    if (editingProduct) {
      updateProduct.mutate(
        { id: editingProduct.id, data },
        {
          onSuccess: () => {
            setEditingProduct(null);
            setFormOpen(false);
          },
        }
      );
    }
  };

  const handleEdit = (product: ProductCardData) => {
    navigate(`/creator/shop/${product.id}/edit`);
  };

  const handleDelete = (id: string) => {
    setDeleteId(id);
  };

  const confirmDelete = () => {
    if (deleteId) {
      deleteProduct.mutate(deleteId);
      setDeleteId(null);
    }
  };

  const handleTogglePublish = (id: string, isPublished: boolean) => {
    updateProduct.mutate({
      id,
      data: {
        is_published: isPublished,
        status: isPublished ? "published" : "draft",
      },
    });
  };

  const handleDuplicate = async (product: ProductCardData) => {
    const result = await duplicateProduct.mutateAsync(product.id);
    if (result) {
      navigate(`/creator/shop/${result.id}/edit`);
    }
  };

  const handleExport = () => {
    exportProducts.mutate();
  };

  const handleOpenChange = (open: boolean) => {
    setFormOpen(open);
    if (!open) {
      setEditingProduct(null);
    }
  };

  // Check if user can create more products
  const canCreate = productLimit.allowed;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <CreatorLayout
      title="Minha Loja"
      description="Gerencie os produtos que você recomenda"
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExport} disabled={exportProducts.isPending}>
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <Button asChild disabled={!canCreate}>
            <Link to="/creator/shop/new">
              <Plus className="h-4 w-4 mr-2" />
              Novo Produto
            </Link>
          </Button>
        </div>
      }
    >
      {/* Product Limit Banner */}
      <ProductLimitBanner currentCount={productLimit.current} limit={productLimit.max} isPro={hasCreatorPro} />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Produtos</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">{stats?.total || 0}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Cliques</CardTitle>
            <MousePointerClick className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">{stats?.clicks || 0}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Favoritos</CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">{stats?.favorites || 0}</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <ProductFilters
        filters={filters}
        rawFilters={rawFilters}
        setFilter={setFilter}
        toggleArrayFilter={toggleArrayFilter}
        clearFilters={clearFilters}
        hasActiveFilters={hasActiveFilters}
        activeFilterCount={activeFilterCount}
        stores={stores}
        resultCount={sortedProducts.length}
      />

      {/* View Mode Toggle */}
      <div className="flex items-center justify-between mb-4 mt-4">
        <div className="flex items-center gap-2">
          {sortedProducts.length > 0 && (
            <div className="flex items-center gap-2">
              <Checkbox
                checked={selectedIds.size === sortedProducts.length && sortedProducts.length > 0}
                onCheckedChange={(checked) => {
                  if (checked) selectAll();
                  else clearSelection();
                }}
              />
              <span className="text-sm text-muted-foreground">Selecionar todos</span>
            </div>
          )}
        </div>

        <div className="flex border rounded-md">
          <Button
            variant={viewMode === "grid" ? "secondary" : "ghost"}
            size="icon"
            onClick={() => setViewMode("grid")}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "list" ? "secondary" : "ghost"}
            size="icon"
            onClick={() => setViewMode("list")}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      <BulkActionsBar
        selectedCount={selectedIds.size}
        totalCount={sortedProducts.length}
        onSelectAll={selectAll}
        onClearSelection={clearSelection}
        onBulkPublish={handleBulkPublish}
        onBulkUnpublish={handleBulkUnpublish}
        onBulkArchive={handleBulkArchive}
        isLoading={bulkUpdate.isPending}
      />

      {/* Products Grid/List */}
      {isLoading ? (
        <div
          className={`grid gap-3 sm:gap-4 ${
            viewMode === "grid" ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"
          }`}
        >
          {[...Array(6)].map((_, i) => (
            <div key={i} className="rounded-xl border bg-card overflow-hidden">
              <Skeleton className="aspect-square" />
              <div className="p-4 space-y-2">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : sortedProducts.length > 0 ? (
        <div
          className={`grid gap-3 sm:gap-4 ${
            viewMode === "grid" ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"
          }`}
        >
          {sortedProducts.map((product) => (
            <div key={product.id} className="relative">
              {/* Selection Checkbox */}
              <div className="absolute top-3 left-3 z-10">
                <Checkbox
                  checked={selectedIds.has(product.id)}
                  onCheckedChange={() => toggleSelect(product.id)}
                  className="bg-background"
                />
              </div>
              <ProductCard
                product={product}
                variant={viewMode}
                showActions
                showStats
                onEdit={handleEdit}
                onDelete={handleDelete}
                onTogglePublish={handleTogglePublish}
                onDuplicate={handleDuplicate}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="border border-dashed border-border rounded-lg py-16 text-center">
          <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">
            {hasActiveFilters ? "Nenhum produto encontrado" : "Nenhum produto ainda"}
          </h3>
          <p className="text-muted-foreground mb-6">
            {hasActiveFilters
              ? "Tente ajustar os filtros ou limpar todos"
              : "Comece adicionando produtos que você recomenda"}
          </p>
          {hasActiveFilters ? (
            <Button variant="outline" onClick={clearFilters}>
              Limpar filtros
            </Button>
          ) : (
            <Button asChild disabled={!canCreate}>
              <Link to="/creator/shop/new">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Produto
              </Link>
            </Button>
          )}
        </div>
      )}

      {/* Quick Add Modal */}
      <ProductForm
        open={formOpen}
        onOpenChange={handleOpenChange}
        product={editingProduct}
        onSubmit={editingProduct ? handleUpdate : handleCreate}
        isLoading={createProduct.isPending || updateProduct.isPending}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Arquivar produto?</AlertDialogTitle>
            <AlertDialogDescription>
              O produto será arquivado e não aparecerá mais no seu perfil público. Você pode
              restaurá-lo depois se necessário.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Arquivar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </CreatorLayout>
  );
}
