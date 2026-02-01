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
    queryKey: ["user-stats", user?.id],
    queryFn: async () => {
      // Get favorites count
      const { count: favoritesCount } = await supabase
        .from("favorites")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user!.id);

      // Get following count
      const { count: followingCount } = await supabase
        .from("follows")
        .select("*", { count: "exact", head: true })
        .eq("follower_id", user!.id);

      let creatorStats = null;
      if (isCreator) {
        // Get profile to find creator_id
        const { data: profile } = await supabase
          .from("profiles")
          .select("id")
          .eq("user_id", user!.id)
          .single();

        if (profile) {
          // Get products count
          const { count: productsCount } = await supabase
            .from("products")
            .select("*", { count: "exact", head: true })
            .eq("creator_id", profile.id);

          // Get followers count
          const { count: followersCount } = await supabase
            .from("follows")
            .select("*", { count: "exact", head: true })
            .eq("creator_id", profile.id);

          // Get total clicks
          const { data: products } = await supabase
            .from("products")
            .select("click_count")
            .eq("creator_id", profile.id);

          const totalClicks = products?.reduce((sum, p) => sum + (p.click_count || 0), 0) || 0;

          creatorStats = {
            productsCount: productsCount || 0,
            followersCount: followersCount || 0,
            totalClicks,
          };
        }
      }

      return {
        favoritesCount: favoritesCount || 0,
        followingCount: followingCount || 0,
        creatorStats,
      };
    },
    enabled: !!user?.id,
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
