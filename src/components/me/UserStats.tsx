import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Heart, Users, Package, Eye, TrendingUp } from "lucide-react";

export function UserStats() {
  const { user, hasRole } = useAuth();
  const isCreator = hasRole("creator");

  const { data: stats, isLoading } = useQuery({
    queryKey: ["user-stats", user?.id, isCreator],
    queryFn: async () => {
      if (!user?.id) return null;

      // Run all queries in parallel for better performance
      const [favoritesResult, followingResult, profileResult] = await Promise.all([
        // Get favorites count
        supabase
          .from("favorites")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id),

        // Get following count
        supabase
          .from("follows")
          .select("*", { count: "exact", head: true })
          .eq("follower_id", user.id),

        // Get profile (using correct column: id, not user_id)
        isCreator
          ? supabase
            .from("profiles")
            .select("id")
            .eq("id", user.id)  // ✅ FIX: profiles uses 'id', not 'user_id'
            .maybeSingle()
          : Promise.resolve({ data: null, error: null }),
      ]);

      let creatorStats = null;

      if (isCreator && profileResult.data) {
        // Run creator queries in parallel
        const [productsCountResult, followersCountResult, productsDataResult] = await Promise.all([
          supabase
            .from("products")
            .select("*", { count: "exact", head: true })
            .eq("creator_id", profileResult.data.id),

          supabase
            .from("follows")
            .select("*", { count: "exact", head: true })
            .eq("creator_id", profileResult.data.id),

          supabase
            .from("products")
            .select("click_count")
            .eq("creator_id", profileResult.data.id),
        ]);

        const totalClicks = productsDataResult.data?.reduce(
          (sum, p) => sum + (p.click_count || 0),
          0
        ) || 0;

        creatorStats = {
          productsCount: productsCountResult.count || 0,
          followersCount: followersCountResult.count || 0,
          totalClicks,
        };
      }

      return {
        favoritesCount: favoritesResult.count || 0,
        followingCount: followingResult.count || 0,
        creatorStats,
      };
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    gcTime: 1000 * 60 * 10, // Keep in cache for 10 minutes
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Estatísticas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-20" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const statItems = [
    {
      label: "Favoritos",
      value: stats?.favoritesCount || 0,
      icon: Heart,
      color: "text-rose-500",
    },
    {
      label: "Seguindo",
      value: stats?.followingCount || 0,
      icon: Users,
      color: "text-blue-500",
    },
  ];

  if (isCreator && stats?.creatorStats) {
    statItems.push(
      {
        label: "Produtos",
        value: stats.creatorStats.productsCount,
        icon: Package,
        color: "text-amber-500",
      },
      {
        label: "Seguidores",
        value: stats.creatorStats.followersCount,
        icon: Users,
        color: "text-green-500",
      },
      {
        label: "Cliques totais",
        value: stats.creatorStats.totalClicks,
        icon: Eye,
        color: "text-purple-500",
      }
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Estatísticas
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {statItems.map((stat) => (
            <div
              key={stat.label}
              className="flex flex-col items-center justify-center p-4 rounded-lg bg-secondary/50 text-center"
            >
              <stat.icon className={`h-5 w-5 mb-2 ${stat.color}`} />
              <span className="text-2xl font-bold">{stat.value.toLocaleString()}</span>
              <span className="text-xs text-muted-foreground">{stat.label}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
