import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChevronDown,
  Filter,
  X,
  Package,
  Image,
  Search,
} from "lucide-react";

const CATEGORIES = [
  "Fashion",
  "Beauty",
  "Tech",
  "Home",
  "Fitness",
  "Food",
  "Travel",
  "Books",
  "Music",
  "Gaming",
];

const STORES = [
  "Amazon",
  "Shopee",
  "Mercado Livre",
  "Magazine Luiza",
  "Americanas",
  "Shein",
  "AliExpress",
];

export interface FeedFiltersState {
  contentType: "products" | "posts" | "all";
  categories: string[];
  stores: string[];
  hasCoupon: boolean;
  priceRange: [number, number];
  sortBy: "recent" | "popular" | "trending" | "price_asc" | "price_desc";
}

interface FeedFiltersProps {
  filters: FeedFiltersState;
  onFiltersChange: (filters: FeedFiltersState) => void;
  className?: string;
}

export function FeedFilters({
  filters,
  onFiltersChange,
  className = "",
}: FeedFiltersProps) {
  const [storeSearch, setStoreSearch] = useState("");
  const [expandedSections, setExpandedSections] = useState({
    contentType: true,
    categories: true,
    stores: false,
    price: false,
    features: false,
  });

  const activeFiltersCount =
    filters.categories.length +
    filters.stores.length +
    (filters.hasCoupon ? 1 : 0) +
    (filters.priceRange[0] > 0 || filters.priceRange[1] < 10000 ? 1 : 0) +
    (filters.contentType !== "all" ? 1 : 0);

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const toggleCategory = (category: string) => {
    const newCategories = filters.categories.includes(category)
      ? filters.categories.filter((c) => c !== category)
      : [...filters.categories, category];
    onFiltersChange({ ...filters, categories: newCategories });
  };

  const toggleStore = (store: string) => {
    const newStores = filters.stores.includes(store)
      ? filters.stores.filter((s) => s !== store)
      : [...filters.stores, store];
    onFiltersChange({ ...filters, stores: newStores });
  };

  const clearFilters = () => {
    onFiltersChange({
      contentType: "all",
      categories: [],
      stores: [],
      hasCoupon: false,
      priceRange: [0, 10000],
      sortBy: "recent",
    });
  };

  const filteredStores = STORES.filter((store) =>
    store.toLowerCase().includes(storeSearch.toLowerCase())
  );

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4" />
          <span className="text-sm font-medium">Filtros</span>
          {activeFiltersCount > 0 && (
            <Badge variant="secondary" className="rounded-full text-xs h-5 px-1.5">
              {activeFiltersCount}
            </Badge>
          )}
        </div>
        {activeFiltersCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="text-xs h-7 px-2"
          >
            <X className="h-3 w-3 mr-1" />
            Limpar
          </Button>
        )}
      </div>

      {/* Sort */}
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Ordenar por</Label>
        <Select
          value={filters.sortBy}
          onValueChange={(value: FeedFiltersState["sortBy"]) =>
            onFiltersChange({ ...filters, sortBy: value })
          }
        >
          <SelectTrigger className="w-full h-9 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="recent">Mais recentes</SelectItem>
            <SelectItem value="popular">Mais populares</SelectItem>
            <SelectItem value="trending">Trending</SelectItem>
            <SelectItem value="price_asc">Menor preço</SelectItem>
            <SelectItem value="price_desc">Maior preço</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2.5">
          {/* Content Type */}
          <Collapsible
            open={expandedSections.contentType}
            onOpenChange={() => toggleSection("contentType")}
          >
            <CollapsibleTrigger className="flex items-center justify-between w-full py-1.5 border-b">
              <span className="text-sm font-medium">Tipo de conteúdo</span>
              <ChevronDown
                className={`h-4 w-4 transition-transform ${
                  expandedSections.contentType ? "rotate-180" : ""
                }`}
              />
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-2 space-y-2">
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={filters.contentType === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() =>
                    onFiltersChange({ ...filters, contentType: "all" })
                  }
                  className="h-8 text-xs"
                >
                  Todos
                </Button>
                <Button
                  variant={
                    filters.contentType === "products" ? "default" : "outline"
                  }
                  size="sm"
                  onClick={() =>
                    onFiltersChange({ ...filters, contentType: "products" })
                  }
                  className="h-8 text-xs"
                >
                  <Package className="h-3 w-3 mr-1" />
                  Produtos
                </Button>
                <Button
                  variant={
                    filters.contentType === "posts" ? "default" : "outline"
                  }
                  size="sm"
                  onClick={() =>
                    onFiltersChange({ ...filters, contentType: "posts" })
                  }
                  className="h-8 text-xs"
                >
                  <Image className="h-3 w-3 mr-1" />
                  Posts
                </Button>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Categories */}
          <Collapsible
            open={expandedSections.categories}
            onOpenChange={() => toggleSection("categories")}
          >
            <CollapsibleTrigger className="flex items-center justify-between w-full py-1.5 border-b">
              <span className="text-sm font-medium">Categorias</span>
              <ChevronDown
                className={`h-4 w-4 transition-transform ${
                  expandedSections.categories ? "rotate-180" : ""
                }`}
              />
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-2">
              <div className="flex flex-wrap gap-1.5">
                {CATEGORIES.map((category) => (
                  <Badge
                    key={category}
                    variant={
                      filters.categories.includes(category)
                        ? "default"
                        : "outline"
                    }
                    className="cursor-pointer hover:bg-primary/80 text-xs px-2 py-0.5"
                    onClick={() => toggleCategory(category)}
                  >
                    {category}
                  </Badge>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Stores */}
          <Collapsible
            open={expandedSections.stores}
            onOpenChange={() => toggleSection("stores")}
          >
            <CollapsibleTrigger className="flex items-center justify-between w-full py-1.5 border-b">
              <span className="text-sm font-medium">Lojas</span>
              <ChevronDown
                className={`h-4 w-4 transition-transform ${
                  expandedSections.stores ? "rotate-180" : ""
                }`}
              />
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-2 space-y-2">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar loja..."
                  value={storeSearch}
                  onChange={(e) => setStoreSearch(e.target.value)}
                  className="pl-9 h-8 text-sm"
                />
              </div>
              <div className="flex flex-wrap gap-1.5">
                {filteredStores.map((store) => (
                  <Badge
                    key={store}
                    variant={
                      filters.stores.includes(store) ? "default" : "outline"
                    }
                    className="cursor-pointer hover:bg-primary/80 text-xs px-2 py-0.5"
                    onClick={() => toggleStore(store)}
                  >
                    {store}
                  </Badge>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Price Range */}
          <Collapsible
            open={expandedSections.price}
            onOpenChange={() => toggleSection("price")}
          >
            <CollapsibleTrigger className="flex items-center justify-between w-full py-1.5 border-b">
              <span className="text-sm font-medium">Faixa de preço</span>
              <ChevronDown
                className={`h-4 w-4 transition-transform ${
                  expandedSections.price ? "rotate-180" : ""
                }`}
              />
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-2 space-y-3">
              <Slider
                value={filters.priceRange}
                onValueChange={(value) =>
                  onFiltersChange({
                    ...filters,
                    priceRange: value as [number, number],
                  })
                }
                max={10000}
                step={100}
                className="w-full"
              />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  {new Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  }).format(filters.priceRange[0])}
                </span>
                <span>
                  {new Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  }).format(filters.priceRange[1])}
                </span>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Features */}
          <Collapsible
            open={expandedSections.features}
            onOpenChange={() => toggleSection("features")}
          >
            <CollapsibleTrigger className="flex items-center justify-between w-full py-1.5 border-b">
              <span className="text-sm font-medium">Características</span>
              <ChevronDown
                className={`h-4 w-4 transition-transform ${
                  expandedSections.features ? "rotate-180" : ""
                }`}
              />
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-2 space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="has-coupon" className="text-sm cursor-pointer">
                  Tem cupom de desconto
                </Label>
                <Switch
                  id="has-coupon"
                  checked={filters.hasCoupon}
                  onCheckedChange={(checked) =>
                    onFiltersChange({ ...filters, hasCoupon: checked })
                  }
                />
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
    </div>
  );
}

export const defaultFeedFilters: FeedFiltersState = {
  contentType: "all",
  categories: [],
  stores: [],
  hasCoupon: false,
  priceRange: [0, 10000],
  sortBy: "recent",
};
