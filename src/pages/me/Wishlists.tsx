import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { UserLayout } from "@/components/layout/UserLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useFavorites } from "@/hooks/useFavorites";
import { FavoriteButton } from "@/components/ui/FavoriteButton";
import { handleProductClick } from "@/lib/tracking";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Heart, ExternalLink, Search, SlidersHorizontal, Tag } from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";

export default function Wishlists() {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { data: favorites, isLoading } = useFavorites();
  
  // Filters
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("recent");
  const [priceRange, setPriceRange] = useState("all");
  const [hasCoupon, setHasCoupon] = useState("all");
  const debouncedSearch = useDebounce(search, 300);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth/signin");
    }
  }, [user, authLoading, navigate]);

  const formatPrice = (price: number | null, currency: string | null) => {
    if (!price) return null;
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: currency || "BRL",
    }).format(price);
  };

  // Apply filters
  const filteredFavorites = favorites?.filter((favorite) => {
    const product = favorite.products as any;
    
    // Search filter
    if (debouncedSearch && !product.title.toLowerCase().includes(debouncedSearch.toLowerCase())) {
      return false;
    }
    
    // Price range filter
    if (priceRange !== "all" && product.price) {
      if (priceRange === "under50" && product.price >= 50) return false;
      if (priceRange === "50to100" && (product.price < 50 || product.price >= 100)) return false;
      if (priceRange === "100to500" && (product.price < 100 || product.price >= 500)) return false;
      if (priceRange === "500plus" && product.price < 500) return false;
    }
    
    return true;
  });

  // Apply sorting
  const sortedFavorites = [...(filteredFavorites || [])].sort((a, b) => {
    const productA = a.products as any;
    const productB = b.products as any;
    
    if (sortBy === "recent") {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
    if (sortBy === "oldest") {
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    }
    if (sortBy === "price_asc") {
      return (productA.price || 0) - (productB.price || 0);
    }
    if (sortBy === "price_desc") {
      return (productB.price || 0) - (productA.price || 0);
    }
    if (sortBy === "name") {
      return productA.title.localeCompare(productB.title);
    }
    return 0;
  });

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <UserLayout
      title="Minha Wishlist"
      description={`${favorites?.length || 0} produtos salvos`}
    >
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Filters Sidebar */}
        <aside className="w-full lg:w-64 space-y-4">
          <div className="p-4 border rounded-lg space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <SlidersHorizontal className="h-4 w-4" />
              Filtros
            </div>
            
            <div>
              <Label>Buscar</Label>
              <div className="relative mt-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar produtos..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 md:pl-11"
                />
              </div>
            </div>

            <div>
              <Label>Ordenar por</Label>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recent">Mais recentes</SelectItem>
                  <SelectItem value="oldest">Mais antigos</SelectItem>
                  <SelectItem value="price_asc">Menor preço</SelectItem>
                  <SelectItem value="price_desc">Maior preço</SelectItem>
                  <SelectItem value="name">Nome A-Z</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Faixa de preço</Label>
              <Select value={priceRange} onValueChange={setPriceRange}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="under50">Até R$ 50</SelectItem>
                  <SelectItem value="50to100">R$ 50 - R$ 100</SelectItem>
                  <SelectItem value="100to500">R$ 100 - R$ 500</SelectItem>
                  <SelectItem value="500plus">Acima de R$ 500</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : sortedFavorites && sortedFavorites.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
              {sortedFavorites.map((favorite) => {
                const product = favorite.products as {
                  id: string;
                  title: string;
                  image_url: string | null;
                  affiliate_url: string;
                  price: number | null;
                  currency: string | null;
                  categories: string[] | null;
                  slug: string | null;
                  profiles: {
                    id: string;
                    username: string;
                    name: string;
                    avatar_url: string | null;
                  };
                };
                
                const productUrl = product.slug ? `/p/${product.slug}` : null;
                
                return (
                  <div key={favorite.id} className="group product-card">
                    {productUrl ? (
                      <Link to={productUrl} className="block">
                        <div className="aspect-square overflow-hidden bg-secondary relative rounded-lg">
                          {product.image_url ? (
                            <img
                              src={product.image_url}
                              alt={product.title}
                              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                              loading="lazy"
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                              <svg className="h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                          )}
                          <div className="absolute top-2 right-2">
                            <FavoriteButton productId={product.id} size="sm" showLabel={false} />
                          </div>
                        </div>
                      </Link>
                    ) : (
                      <a
                        href={product.affiliate_url}
                        onClick={(e) => handleProductClick(product.affiliate_url, product.id, { userId: user?.id, event: e })}
                        className="block"
                      >
                        <div className="aspect-square overflow-hidden bg-secondary relative rounded-lg">
                          {product.image_url ? (
                            <img
                              src={product.image_url}
                              alt={product.title}
                              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                              loading="lazy"
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                              <svg className="h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                          )}
                          <div className="absolute top-2 right-2">
                            <FavoriteButton productId={product.id} size="sm" showLabel={false} />
                          </div>
                        </div>
                      </a>
                    )}

                    <div className="p-3 space-y-2">
                      <Link
                        to={`/${product.profiles?.username}`}
                        className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground"
                      >
                        <Avatar className="h-5 w-5">
                          <AvatarImage src={product.profiles?.avatar_url || undefined} />
                          <AvatarFallback className="text-[10px]">
                            {product.profiles?.name?.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        @{product.profiles?.username}
                      </Link>

                      {productUrl ? (
                        <Link to={productUrl}>
                          <h3 className="font-medium text-sm line-clamp-2 group-hover:underline">
                            {product.title}
                          </h3>
                        </Link>
                      ) : (
                        <a
                          href={product.affiliate_url}
                          onClick={(e) => handleProductClick(product.affiliate_url, product.id, { userId: user?.id, event: e })}
                        >
                          <h3 className="font-medium text-sm line-clamp-2 group-hover:underline">
                            {product.title}
                          </h3>
                        </a>
                      )}

                      {product.categories && product.categories.length > 0 && (
                        <div className="flex items-center gap-1 flex-wrap">
                          {product.categories.slice(0, 2).map((cat) => (
                            <span key={cat} className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                              <Tag className="h-3 w-3" />
                              {cat}
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        {product.price && (
                          <p className="font-semibold text-sm">
                            {formatPrice(product.price, product.currency)}
                          </p>
                        )}
                        <ExternalLink className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="border border-dashed border-border rounded-lg py-16 text-center">
              <Heart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">
                {debouncedSearch ? "Nenhum produto encontrado" : "Sua wishlist está vazia"}
              </h3>
              <p className="text-muted-foreground mb-6">
                {debouncedSearch
                  ? "Tente buscar por outro termo"
                  : "Explore produtos e salve os que você mais gosta"}
              </p>
              {!debouncedSearch && (
                <Link to="/" className="text-primary hover:underline">
                  Explorar produtos
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </UserLayout>
  );
}
