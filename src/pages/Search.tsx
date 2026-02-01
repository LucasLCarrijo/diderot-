import { useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { SiteHeader } from "@/components/site/SiteHeader";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { FollowButton } from "@/components/ui/FollowButton";
import { FeedCard } from "@/components/feed/FeedCard";
import { EmptyFeed } from "@/components/feed/EmptyFeed";
import { useSearch } from "@/hooks/useSearch";
import { Search, Package, Users } from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  const [query, setQuery] = useState(initialQuery);
  const debouncedQuery = useDebounce(query, 300);
  const { data, isLoading } = useSearch(debouncedQuery);

  const handleSearch = (value: string) => {
    setQuery(value);
    if (value) {
      setSearchParams({ q: value });
    } else {
      setSearchParams({});
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="container py-8">
        <div className="max-w-4xl mx-auto">
          {/* Search Input */}
          <div className="relative mb-8">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Buscar produtos, creators..."
              value={query}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-12 h-12 text-lg"
              autoFocus
            />
          </div>

          {/* Results */}
          {debouncedQuery.length >= 2 ? (
            <Tabs defaultValue="products">
              <TabsList className="mb-6">
                <TabsTrigger value="products" className="gap-2">
                  <Package className="h-4 w-4" />
                  Produtos ({data?.products?.length || 0})
                </TabsTrigger>
                <TabsTrigger value="creators" className="gap-2">
                  <Users className="h-4 w-4" />
                  Creators ({data?.creators?.length || 0})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="products">
                {isLoading ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <Skeleton key={i} className="aspect-square rounded-lg" />
                    ))}
                  </div>
                ) : data?.products && data.products.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {data.products.map((product) => (
                      <FeedCard
                        key={product.id}
                        product={{
                          ...product,
                          affiliate_url: "",
                          categories: null,
                          click_count: null,
                          favorite_count: null,
                          created_at: new Date().toISOString(),
                          coupon_code: null,
                          creator: {
                            ...product.creator,
                            avatar_url: null,
                            is_verified: null,
                          },
                        }}
                        showBadges={false}
                      />
                    ))}
                  </div>
                ) : (
                  <EmptyFeed type="search" searchQuery={debouncedQuery} />
                )}
              </TabsContent>

              <TabsContent value="creators">
                {isLoading ? (
                  <div className="space-y-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <Skeleton key={i} className="h-20 rounded-lg" />
                    ))}
                  </div>
                ) : data?.creators && data.creators.length > 0 ? (
                  <div className="space-y-4">
                    {data.creators.map((creator) => (
                      <div
                        key={creator.id}
                        className="flex items-center gap-4 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                      >
                        <Link to={`/${creator.username}`}>
                          <Avatar className="h-14 w-14">
                            <AvatarImage src={creator.avatar_url || undefined} />
                            <AvatarFallback>{creator.name?.charAt(0)}</AvatarFallback>
                          </Avatar>
                        </Link>
                        <div className="flex-1 min-w-0">
                          <Link to={`/${creator.username}`} className="hover:underline">
                            <h3 className="font-semibold">{creator.name}</h3>
                          </Link>
                          <p className="text-sm text-muted-foreground">@{creator.username}</p>
                          {creator.bio && (
                            <p className="text-sm text-muted-foreground line-clamp-1 mt-1">
                              {creator.bio}
                            </p>
                          )}
                        </div>
                        <FollowButton creatorId={creator.id} size="sm" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyFeed type="search" searchQuery={debouncedQuery} />
                )}
              </TabsContent>
            </Tabs>
          ) : (
            <div className="text-center py-16 text-muted-foreground">
              <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Digite pelo menos 2 caracteres para buscar</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
