import React, { useState, useCallback, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, Check, Package, X, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMyProducts, Product } from '@/hooks/useCreatorProducts';
import { useDebounce } from '@/hooks/useDebounce';
import { PRODUCT_CATEGORIES } from '@/lib/validations/product';

interface ProductSelectorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectProduct: (product: Product) => void;
  selectedProductIds?: string[];
  disabledProductIds?: string[];
}

const ITEMS_PER_PAGE = 9;

export function ProductSelectorModal({
  open,
  onOpenChange,
  onSelectProduct,
  selectedProductIds = [],
  disabledProductIds = [],
}: ProductSelectorModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const debouncedSearch = useDebounce(searchQuery, 300);

  const { data: products, isLoading } = useMyProducts({
    status: 'published',
  });

  // Filter products
  const filteredProducts = useMemo(() => {
    if (!products) return [];
    
    return products.filter(product => {
      // Search filter
      const matchesSearch = 
        product.title.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        product.store?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        product.description?.toLowerCase().includes(debouncedSearch.toLowerCase());
      
      // Category filter
      const matchesCategory = 
        categoryFilter === 'all' || 
        product.categories?.includes(categoryFilter);
      
      return matchesSearch && matchesCategory;
    });
  }, [products, debouncedSearch, categoryFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredProducts.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredProducts, currentPage]);

  // Reset page when filters change
  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  }, []);

  const handleCategoryChange = useCallback((value: string) => {
    setCategoryFilter(value);
    setCurrentPage(1);
  }, []);

  const handleSelectProduct = useCallback((product: Product) => {
    onSelectProduct(product);
    onOpenChange(false);
    setSearchQuery('');
    setCategoryFilter('all');
    setCurrentPage(1);
  }, [onSelectProduct, onOpenChange]);

  const clearFilters = useCallback(() => {
    setSearchQuery('');
    setCategoryFilter('all');
    setCurrentPage(1);
  }, []);

  const hasFilters = searchQuery || categoryFilter !== 'all';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Selecionar Produto
          </DialogTitle>
        </DialogHeader>

        {/* Filters */}
        <div className="space-y-3 py-2">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por título, loja ou descrição..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-9 pr-9"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                onClick={() => handleSearchChange('')}
              >
                <X className="w-3 h-3" />
              </Button>
            )}
          </div>

          {/* Category filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <Select value={categoryFilter} onValueChange={handleCategoryChange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas categorias</SelectItem>
                {PRODUCT_CATEGORIES.map(category => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {hasFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Limpar filtros
              </Button>
            )}

            <div className="ml-auto text-sm text-muted-foreground">
              {filteredProducts.length} {filteredProducts.length === 1 ? 'produto' : 'produtos'}
            </div>
          </div>
        </div>

        {/* Products grid */}
        <ScrollArea className="flex-1 -mx-6 px-6">
          {isLoading ? (
            <div className="grid grid-cols-3 gap-3">
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="aspect-square rounded-lg" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              ))}
            </div>
          ) : paginatedProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <Package className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium">Nenhum produto encontrado</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                {hasFilters 
                  ? 'Tente ajustar os filtros ou buscar por outros termos'
                  : 'Crie produtos primeiro para poder adicioná-los aos posts'
                }
              </p>
              {hasFilters && (
                <Button variant="outline" size="sm" className="mt-4" onClick={clearFilters}>
                  Limpar filtros
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              {paginatedProducts.map(product => {
                const isSelected = selectedProductIds.includes(product.id);
                const isDisabled = disabledProductIds.includes(product.id);
                const isUsed = isSelected || isDisabled;
                
                return (
                  <button
                    key={product.id}
                    onClick={() => !isUsed && handleSelectProduct(product)}
                    disabled={isUsed}
                    className={cn(
                      'relative group rounded-lg overflow-hidden border-2 transition-all text-left',
                      isUsed
                        ? 'border-muted opacity-50 cursor-not-allowed'
                        : 'border-transparent hover:border-primary hover:shadow-md'
                    )}
                  >
                    {/* Image */}
                    <div className="aspect-square bg-muted relative">
                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt={product.title}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="w-8 h-8 text-muted-foreground" />
                        </div>
                      )}
                      
                      {/* Overlay on hover */}
                      {!isUsed && (
                        <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <div className="bg-primary text-primary-foreground rounded-full p-2">
                            <Check className="w-5 h-5" />
                          </div>
                        </div>
                      )}

                      {/* Type badge */}
                      {product.monetization_type && (
                        <Badge 
                          variant="secondary" 
                          className="absolute top-2 left-2 text-[10px] capitalize"
                        >
                          {product.monetization_type === 'affiliate' ? 'Afiliado' :
                           product.monetization_type === 'coupon' ? 'Cupom' : 'Recomendação'}
                        </Badge>
                      )}
                    </div>

                    {/* Info */}
                    <div className="p-2">
                      <p className="text-sm font-medium line-clamp-1">{product.title}</p>
                      {product.store && (
                        <p className="text-xs text-muted-foreground line-clamp-1">{product.store}</p>
                      )}
                      {product.price && (
                        <p className="text-xs font-medium text-primary mt-1">
                          {new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: product.currency || 'BRL'
                          }).format(product.price)}
                        </p>
                      )}
                    </div>

                    {/* Used indicator */}
                    {isUsed && (
                      <div className="absolute top-2 right-2">
                        <Badge variant="secondary" className="text-[10px]">
                          {isSelected ? 'No post' : 'Usado'}
                        </Badge>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </ScrollArea>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              Página {currentPage} de {totalPages}
            </p>
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let page: number;
                if (totalPages <= 5) {
                  page = i + 1;
                } else if (currentPage <= 3) {
                  page = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  page = totalPages - 4 + i;
                } else {
                  page = currentPage - 2 + i;
                }
                return (
                  <Button
                    key={page}
                    variant={currentPage === page ? 'default' : 'outline'}
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </Button>
                );
              })}
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
