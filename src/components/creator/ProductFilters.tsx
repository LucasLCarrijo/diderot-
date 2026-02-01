import { useState, useEffect } from "react";
import { Search, X, SlidersHorizontal, Tag, Store, Ticket, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ExtendedProductFilters } from "@/hooks/useProductFilters";
import { PRODUCT_CATEGORIES } from "@/lib/validations/product";

interface ProductFiltersProps {
  filters: ExtendedProductFilters;
  rawFilters: ExtendedProductFilters;
  setFilter: <K extends keyof ExtendedProductFilters>(
    key: K,
    value: ExtendedProductFilters[K]
  ) => void;
  toggleArrayFilter: (
    key: "status" | "monetization_type" | "categories",
    value: string
  ) => void;
  clearFilters: () => void;
  hasActiveFilters: boolean;
  activeFilterCount: number;
  stores: string[];
  resultCount?: number;
}

const STATUS_OPTIONS = [
  { value: "published", label: "Publicados" },
  { value: "draft", label: "Rascunhos" },
  { value: "archived", label: "Arquivados" },
];

const TYPE_OPTIONS = [
  { value: "affiliate", label: "Afiliado" },
  { value: "coupon", label: "Cupom" },
  { value: "recommendation", label: "Recomendação" },
];

const SORT_OPTIONS = [
  { value: "created_at-desc", label: "Mais recentes" },
  { value: "created_at-asc", label: "Mais antigos" },
  { value: "click_count-desc", label: "Mais cliques" },
  { value: "favorite_count-desc", label: "Mais favoritados" },
  { value: "title-asc", label: "A-Z" },
];

export function ProductFilters({
  filters,
  rawFilters,
  setFilter,
  toggleArrayFilter,
  clearFilters,
  hasActiveFilters,
  activeFilterCount,
  stores,
  resultCount,
}: ProductFiltersProps) {
  const [priceRange, setPriceRange] = useState([
    filters.price_min || 0,
    filters.price_max || 10000,
  ]);
  const [openSections, setOpenSections] = useState({
    status: true,
    type: true,
    categories: false,
    store: false,
    price: false,
  });

  // Sync price range with filters
  useEffect(() => {
    setPriceRange([filters.price_min || 0, filters.price_max || 10000]);
  }, [filters.price_min, filters.price_max]);

  const handlePriceChange = (value: number[]) => {
    setPriceRange(value);
  };

  const handlePriceCommit = (value: number[]) => {
    setFilter("price_min", value[0] > 0 ? value[0] : undefined);
    setFilter("price_max", value[1] < 10000 ? value[1] : undefined);
  };

  const handleSortChange = (value: string) => {
    const [sortBy, sortOrder] = value.split("-") as [
      ExtendedProductFilters["sort_by"],
      ExtendedProductFilters["sort_order"]
    ];
    setFilter("sort_by", sortBy);
    setFilter("sort_order", sortOrder);
  };

  const currentSort = `${filters.sort_by || "created_at"}-${filters.sort_order || "desc"}`;

  const FilterContent = () => (
    <div className="space-y-6">
      {/* Sort */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Ordenar por</Label>
        <Select value={currentSort} onValueChange={handleSortChange}>
          <SelectTrigger>
            <SelectValue placeholder="Ordenar por" />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Separator />

      {/* Status */}
      <Collapsible
        open={openSections.status}
        onOpenChange={(open) =>
          setOpenSections((prev) => ({ ...prev, status: open }))
        }
      >
        <CollapsibleTrigger className="flex items-center justify-between w-full py-2">
          <Label className="text-sm font-medium cursor-pointer">Status</Label>
          <ChevronDown
            className={`h-4 w-4 transition-transform ${
              openSections.status ? "rotate-180" : ""
            }`}
          />
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-3 pt-2">
          {STATUS_OPTIONS.map((option) => (
            <div key={option.value} className="flex items-center space-x-2">
              <Checkbox
                id={`status-${option.value}`}
                checked={filters.status?.includes(option.value) || false}
                onCheckedChange={() => toggleArrayFilter("status", option.value)}
              />
              <Label
                htmlFor={`status-${option.value}`}
                className="text-sm font-normal cursor-pointer"
              >
                {option.label}
              </Label>
            </div>
          ))}
        </CollapsibleContent>
      </Collapsible>

      <Separator />

      {/* Monetization Type */}
      <Collapsible
        open={openSections.type}
        onOpenChange={(open) =>
          setOpenSections((prev) => ({ ...prev, type: open }))
        }
      >
        <CollapsibleTrigger className="flex items-center justify-between w-full py-2">
          <Label className="text-sm font-medium cursor-pointer">Tipo</Label>
          <ChevronDown
            className={`h-4 w-4 transition-transform ${
              openSections.type ? "rotate-180" : ""
            }`}
          />
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-3 pt-2">
          {TYPE_OPTIONS.map((option) => (
            <div key={option.value} className="flex items-center space-x-2">
              <Checkbox
                id={`type-${option.value}`}
                checked={filters.monetization_type?.includes(option.value) || false}
                onCheckedChange={() =>
                  toggleArrayFilter("monetization_type", option.value)
                }
              />
              <Label
                htmlFor={`type-${option.value}`}
                className="text-sm font-normal cursor-pointer"
              >
                {option.label}
              </Label>
            </div>
          ))}
        </CollapsibleContent>
      </Collapsible>

      <Separator />

      {/* Categories */}
      <Collapsible
        open={openSections.categories}
        onOpenChange={(open) =>
          setOpenSections((prev) => ({ ...prev, categories: open }))
        }
      >
        <CollapsibleTrigger className="flex items-center justify-between w-full py-2">
          <div className="flex items-center gap-2">
            <Tag className="h-4 w-4" />
            <Label className="text-sm font-medium cursor-pointer">Categorias</Label>
          </div>
          <ChevronDown
            className={`h-4 w-4 transition-transform ${
              openSections.categories ? "rotate-180" : ""
            }`}
          />
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-3 pt-2 max-h-48 overflow-y-auto">
          {PRODUCT_CATEGORIES.map((category) => (
            <div key={category} className="flex items-center space-x-2">
              <Checkbox
                id={`category-${category}`}
                checked={filters.categories?.includes(category) || false}
                onCheckedChange={() => toggleArrayFilter("categories", category)}
              />
              <Label
                htmlFor={`category-${category}`}
                className="text-sm font-normal cursor-pointer"
              >
                {category}
              </Label>
            </div>
          ))}
        </CollapsibleContent>
      </Collapsible>

      <Separator />

      {/* Store */}
      {stores.length > 0 && (
        <>
          <Collapsible
            open={openSections.store}
            onOpenChange={(open) =>
              setOpenSections((prev) => ({ ...prev, store: open }))
            }
          >
            <CollapsibleTrigger className="flex items-center justify-between w-full py-2">
              <div className="flex items-center gap-2">
                <Store className="h-4 w-4" />
                <Label className="text-sm font-medium cursor-pointer">Loja</Label>
              </div>
              <ChevronDown
                className={`h-4 w-4 transition-transform ${
                  openSections.store ? "rotate-180" : ""
                }`}
              />
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-2">
              <Select
                value={filters.store || "all"}
                onValueChange={(value) =>
                  setFilter("store", value === "all" ? undefined : value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todas as lojas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as lojas</SelectItem>
                  {stores.map((store) => (
                    <SelectItem key={store} value={store}>
                      {store}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CollapsibleContent>
          </Collapsible>
          <Separator />
        </>
      )}

      {/* Has Coupon */}
      <div className="flex items-center justify-between py-2">
        <div className="flex items-center gap-2">
          <Ticket className="h-4 w-4" />
          <Label className="text-sm font-medium cursor-pointer">Tem cupom</Label>
        </div>
        <Switch
          checked={filters.has_coupon || false}
          onCheckedChange={(checked) =>
            setFilter("has_coupon", checked || undefined)
          }
        />
      </div>

      <Separator />

      {/* Price Range */}
      <Collapsible
        open={openSections.price}
        onOpenChange={(open) =>
          setOpenSections((prev) => ({ ...prev, price: open }))
        }
      >
        <CollapsibleTrigger className="flex items-center justify-between w-full py-2">
          <Label className="text-sm font-medium cursor-pointer">
            Faixa de preço
          </Label>
          <ChevronDown
            className={`h-4 w-4 transition-transform ${
              openSections.price ? "rotate-180" : ""
            }`}
          />
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-4 space-y-4">
          <Slider
            value={priceRange}
            onValueChange={handlePriceChange}
            onValueCommit={handlePriceCommit}
            max={10000}
            step={100}
            className="w-full"
          />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>R$ {priceRange[0].toLocaleString("pt-BR")}</span>
            <span>R$ {priceRange[1].toLocaleString("pt-BR")}</span>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Clear Filters */}
      {hasActiveFilters && (
        <>
          <Separator />
          <Button
            variant="outline"
            className="w-full"
            onClick={clearFilters}
          >
            <X className="h-4 w-4 mr-2" />
            Limpar filtros
          </Button>
        </>
      )}
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Search and Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar produtos..."
            className="pl-9"
            value={rawFilters.search || ""}
            onChange={(e) => setFilter("search", e.target.value || undefined)}
          />
          {rawFilters.search && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
              onClick={() => setFilter("search", undefined)}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Mobile: Filter Sheet */}
        <div className="sm:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" className="w-full">
                <SlidersHorizontal className="h-4 w-4 mr-2" />
                Filtros
                {activeFilterCount > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {activeFilterCount}
                  </Badge>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] overflow-y-auto">
              <SheetHeader>
                <SheetTitle>Filtros</SheetTitle>
              </SheetHeader>
              <div className="mt-6">
                <FilterContent />
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Desktop: Sort dropdown */}
        <div className="hidden sm:flex gap-2">
          <Select value={currentSort} onValueChange={handleSortChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Ordenar por" />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Result count and active filters */}
      <div className="flex flex-wrap items-center gap-2">
        {resultCount !== undefined && (
          <span className="text-sm text-muted-foreground">
            {resultCount} {resultCount === 1 ? "produto" : "produtos"}
          </span>
        )}

        {/* Active filter badges */}
        {filters.status?.map((s) => (
          <Badge
            key={`status-${s}`}
            variant="secondary"
            className="cursor-pointer"
            onClick={() => toggleArrayFilter("status", s)}
          >
            {STATUS_OPTIONS.find((o) => o.value === s)?.label}
            <X className="h-3 w-3 ml-1" />
          </Badge>
        ))}
        {filters.monetization_type?.map((t) => (
          <Badge
            key={`type-${t}`}
            variant="secondary"
            className="cursor-pointer"
            onClick={() => toggleArrayFilter("monetization_type", t)}
          >
            {TYPE_OPTIONS.find((o) => o.value === t)?.label}
            <X className="h-3 w-3 ml-1" />
          </Badge>
        ))}
        {filters.categories?.map((c) => (
          <Badge
            key={`category-${c}`}
            variant="secondary"
            className="cursor-pointer"
            onClick={() => toggleArrayFilter("categories", c)}
          >
            {c}
            <X className="h-3 w-3 ml-1" />
          </Badge>
        ))}
        {filters.store && (
          <Badge
            variant="secondary"
            className="cursor-pointer"
            onClick={() => setFilter("store", undefined)}
          >
            {filters.store}
            <X className="h-3 w-3 ml-1" />
          </Badge>
        )}
        {filters.has_coupon && (
          <Badge
            variant="secondary"
            className="cursor-pointer"
            onClick={() => setFilter("has_coupon", undefined)}
          >
            Com cupom
            <X className="h-3 w-3 ml-1" />
          </Badge>
        )}
        {(filters.price_min || filters.price_max) && (
          <Badge
            variant="secondary"
            className="cursor-pointer"
            onClick={() => {
              setFilter("price_min", undefined);
              setFilter("price_max", undefined);
            }}
          >
            R$ {filters.price_min || 0} - R$ {filters.price_max || "10000+"}
            <X className="h-3 w-3 ml-1" />
          </Badge>
        )}

        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            Limpar tudo
          </Button>
        )}
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden sm:block">
        {/* Filters shown inline on desktop - will be rendered in layout */}
      </div>
    </div>
  );
}

// Desktop sidebar component
export function ProductFiltersSidebar({
  filters,
  rawFilters,
  setFilter,
  toggleArrayFilter,
  clearFilters,
  hasActiveFilters,
  stores,
}: Omit<ProductFiltersProps, "activeFilterCount" | "resultCount">) {
  const [priceRange, setPriceRange] = useState([
    filters.price_min || 0,
    filters.price_max || 10000,
  ]);

  const handlePriceChange = (value: number[]) => {
    setPriceRange(value);
  };

  const handlePriceCommit = (value: number[]) => {
    setFilter("price_min", value[0] > 0 ? value[0] : undefined);
    setFilter("price_max", value[1] < 10000 ? value[1] : undefined);
  };

  const handleSortChange = (value: string) => {
    const [sortBy, sortOrder] = value.split("-") as [
      ExtendedProductFilters["sort_by"],
      ExtendedProductFilters["sort_order"]
    ];
    setFilter("sort_by", sortBy);
    setFilter("sort_order", sortOrder);
  };

  const currentSort = `${filters.sort_by || "created_at"}-${filters.sort_order || "desc"}`;

  return (
    <div className="space-y-6 p-4 border rounded-lg bg-card">
      <h3 className="font-medium">Filtros</h3>

      {/* Sort */}
      <div className="space-y-2">
        <Label className="text-sm">Ordenar por</Label>
        <Select value={currentSort} onValueChange={handleSortChange}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Separator />

      {/* Status */}
      <div className="space-y-3">
        <Label className="text-sm">Status</Label>
        {STATUS_OPTIONS.map((option) => (
          <div key={option.value} className="flex items-center space-x-2">
            <Checkbox
              id={`sidebar-status-${option.value}`}
              checked={filters.status?.includes(option.value) || false}
              onCheckedChange={() => toggleArrayFilter("status", option.value)}
            />
            <Label
              htmlFor={`sidebar-status-${option.value}`}
              className="text-sm font-normal cursor-pointer"
            >
              {option.label}
            </Label>
          </div>
        ))}
      </div>

      <Separator />

      {/* Type */}
      <div className="space-y-3">
        <Label className="text-sm">Tipo</Label>
        {TYPE_OPTIONS.map((option) => (
          <div key={option.value} className="flex items-center space-x-2">
            <Checkbox
              id={`sidebar-type-${option.value}`}
              checked={filters.monetization_type?.includes(option.value) || false}
              onCheckedChange={() =>
                toggleArrayFilter("monetization_type", option.value)
              }
            />
            <Label
              htmlFor={`sidebar-type-${option.value}`}
              className="text-sm font-normal cursor-pointer"
            >
              {option.label}
            </Label>
          </div>
        ))}
      </div>

      <Separator />

      {/* Categories */}
      <div className="space-y-3">
        <Label className="text-sm">Categorias</Label>
        <div className="max-h-40 overflow-y-auto space-y-2">
          {PRODUCT_CATEGORIES.map((category) => (
            <div key={category} className="flex items-center space-x-2">
              <Checkbox
                id={`sidebar-category-${category}`}
                checked={filters.categories?.includes(category) || false}
                onCheckedChange={() => toggleArrayFilter("categories", category)}
              />
              <Label
                htmlFor={`sidebar-category-${category}`}
                className="text-sm font-normal cursor-pointer"
              >
                {category}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {stores.length > 0 && (
        <>
          <Separator />
          <div className="space-y-2">
            <Label className="text-sm">Loja</Label>
            <Select
              value={filters.store || "all"}
              onValueChange={(value) =>
                setFilter("store", value === "all" ? undefined : value)
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Todas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {stores.map((store) => (
                  <SelectItem key={store} value={store}>
                    {store}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </>
      )}

      <Separator />

      {/* Has Coupon */}
      <div className="flex items-center justify-between">
        <Label className="text-sm">Tem cupom</Label>
        <Switch
          checked={filters.has_coupon || false}
          onCheckedChange={(checked) =>
            setFilter("has_coupon", checked || undefined)
          }
        />
      </div>

      <Separator />

      {/* Price Range */}
      <div className="space-y-4">
        <Label className="text-sm">Faixa de preço</Label>
        <Slider
          value={priceRange}
          onValueChange={handlePriceChange}
          onValueCommit={handlePriceCommit}
          max={10000}
          step={100}
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>R$ {priceRange[0].toLocaleString("pt-BR")}</span>
          <span>R$ {priceRange[1].toLocaleString("pt-BR")}</span>
        </div>
      </div>

      {/* Clear Filters */}
      {hasActiveFilters && (
        <>
          <Separator />
          <Button variant="outline" className="w-full" onClick={clearFilters}>
            <X className="h-4 w-4 mr-2" />
            Limpar filtros
          </Button>
        </>
      )}
    </div>
  );
}
