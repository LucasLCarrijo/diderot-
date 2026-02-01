import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { SiteHeader } from "@/components/site/SiteHeader";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FollowButton } from "@/components/ui/FollowButton";
import { Skeleton } from "@/components/ui/skeleton";
import { BadgeCheck, Search, Users, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import { useDebounce } from "@/hooks/useDebounce";

const CATEGORIES = [
  "Todos",
  "Moda",
  "Beleza",
  "Tech",
  "Casa",
  "Fitness",
  "Viagem",
  "Comida",
  "Lifestyle",
];

export default function DiscoverCreators() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("Todos");
  const [sortBy, setSortBy] = useState("popular");
  const debouncedSearch = useDebounce(search, 300);

  // Get creators the user follows
  const { data: followingIds } = useQuery({
    queryKey: ["following-ids", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from("follows")
        .select("creator_id")
        .eq("follower_id", user.id);
      return data?.map((f) => f.creator_id) || [];
    },
    enabled: !!user,
  });

  // Get all creators with their follower counts
  const { data: creators, isLoading } = useQuery({
    queryKey: ["discover-creators", debouncedSearch, category, sortBy],
    queryFn: async () => {
      // Select only public fields - exclude user_id for security
      let query = supabase
        .from("profiles")
        .select(`
          id, name, username, bio, avatar_url, instagram_url, tiktok_url, youtube_url, website_url, is_verified, categories, created_at, updated_at,
          products:products(count),
          followers:follows!follows_creator_id_fkey(count)
        `);

      if (debouncedSearch) {
        query = query.or(
          `name.ilike.%${debouncedSearch}%,username.ilike.%${debouncedSearch}%,bio.ilike.%${debouncedSearch}%`
        );
      }

      const { data, error } = await query;
      if (error) throw error;

      // Sort results
      let sorted = [...(data || [])];
      if (sortBy === "popular") {
        sorted.sort((a, b) => {
          const aCount = (a.followers as any)?.[0]?.count || 0;
          const bCount = (b.followers as any)?.[0]?.count || 0;
          return bCount - aCount;
        });
      } else if (sortBy === "recent") {
        sorted.sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      } else if (sortBy === "alphabetical") {
        sorted.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
      }

      return sorted;
    },
  });

  // Filter out creators the user already follows (using profile.id match with following data)
  const filteredCreators = creators?.filter((creator) => {
    // Don't show creators already followed
    if (followingIds?.includes(creator.id)) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Descubra Creators</h1>
          <p className="text-muted-foreground">
            Encontre creators incríveis para seguir e descobrir produtos
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <aside className="w-full lg:w-64 space-y-6">
            <div className="space-y-4 p-4 border rounded-lg">
              <div>
                <Label>Buscar</Label>
                <div className="relative mt-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Nome ou @handle"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10 md:pl-11"
                  />
                </div>
              </div>

              <div>
                <Label>Categoria</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Ordenar por</Label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="popular">Mais populares</SelectItem>
                    <SelectItem value="recent">Mais recentes</SelectItem>
                    <SelectItem value="alphabetical">Alfabético</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </aside>

          {/* Creators Grid */}
          <div className="flex-1">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="p-6 border rounded-lg space-y-4">
                    <div className="flex items-center gap-4">
                      <Skeleton className="h-16 w-16 rounded-full" />
                      <div className="space-y-2">
                        <Skeleton className="h-5 w-32" />
                        <Skeleton className="h-4 w-24" />
                      </div>
                    </div>
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ))}
              </div>
            ) : filteredCreators && filteredCreators.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
                {filteredCreators.map((creator) => {
                  const followerCount =
                    (creator.followers as any)?.[0]?.count || 0;
                  const productCount =
                    (creator.products as any)?.[0]?.count || 0;

                  return (
                    <div
                      key={creator.id}
                      className="p-6 border rounded-lg hover:border-primary/50 transition-colors"
                    >
                      <Link
                        to={`/${creator.username}`}
                        className="flex items-center gap-4 mb-4"
                      >
                        <Avatar className="h-16 w-16">
                          <AvatarImage src={creator.avatar_url || ""} />
                          <AvatarFallback className="text-xl">
                            {creator.name?.[0] || creator.username?.[0] || "?"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1">
                            <span className="font-semibold truncate">
                              {creator.name || creator.username}
                            </span>
                            {creator.is_verified && (
                              <BadgeCheck className="h-5 w-5 text-primary flex-shrink-0" />
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground truncate">
                            @{creator.username}
                          </p>
                        </div>
                      </Link>

                      {creator.bio && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                          {creator.bio}
                        </p>
                      )}

                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          <span>{followerCount} seguidores</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <TrendingUp className="h-4 w-4" />
                          <span>{productCount} produtos</span>
                        </div>
                      </div>

                      <FollowButton creatorId={creator.id} className="w-full" />
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">
                  Nenhum creator encontrado
                </h3>
                <p className="text-muted-foreground">
                  {search
                    ? "Tente buscar por outro nome"
                    : "Não há creators disponíveis no momento"}
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
