import { useState } from "react";
import { useParams } from "react-router-dom";
import { SiteHeader } from "@/components/site/SiteHeader";
import { CreatorHeader } from "@/components/creator/CreatorHeader";
import { CreatorTabs } from "@/components/creator/CreatorTabs";
import { ProductsGrid } from "@/components/creator/ProductsGrid";
import { CollectionsGrid } from "@/components/creator/CollectionsGrid";
import { FeedGrid } from "@/components/creator/FeedGrid";
import {
  useCreatorProfile,
  useCreatorProducts,
  useCreatorCollections,
  useCreatorPosts,
  useCreatorFollowerCount,
} from "@/hooks/useCreatorProfile";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ShoppingBag } from "lucide-react";

type TabType = "products" | "collections" | "feed";

export default function CreatorPage() {
  const { username } = useParams<{ username: string }>();
  const [activeTab, setActiveTab] = useState<TabType>("products");

  const { data: profile, isLoading: profileLoading } = useCreatorProfile(username || "");
  const { data: products = [], isLoading: productsLoading } = useCreatorProducts(profile?.id);
  const { data: collections = [], isLoading: collectionsLoading } = useCreatorCollections(profile?.id);
  const { data: posts = [], isLoading: postsLoading } = useCreatorPosts(profile?.id);
  const { data: followerCount = 0 } = useCreatorFollowerCount(profile?.id);

  // Check if creator has an active subscription
  const { data: hasActiveSubscription, isLoading: subLoading } = useQuery({
    queryKey: ["creator-sub-status", profile?.id],
    queryFn: async () => {
      if (!profile?.id) return false;
      const { data } = await supabase
        .from("subscriptions")
        .select("id")
        .eq("user_id", profile.id)
        .in("status", ["active", "trialing"])
        .maybeSingle();
      return !!data;
    },
    enabled: !!profile?.id,
  });

  if (profileLoading) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <div className="container py-8">
          <div className="flex flex-col items-center gap-4">
            <Skeleton className="h-24 w-24 rounded-full" />
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <div className="container py-16 text-center">
          <h1 className="text-2xl font-sans font-semibold mb-2">Creator não encontrado</h1>
          <p className="text-muted-foreground">O perfil @{username} não existe ou foi removido.</p>
        </div>
      </div>
    );
  }

  // Store unavailable when creator has no active subscription
  if (!subLoading && hasActiveSubscription === false) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <CreatorHeader profile={profile} followerCount={followerCount} />
        <div className="container py-16 text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mx-auto">
            <ShoppingBag className="h-8 w-8 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold">Esta loja está temporariamente indisponível.</h2>
          <p className="text-muted-foreground max-w-sm mx-auto">
            Volte em breve para ver os produtos de @{username}.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <CreatorHeader profile={profile} followerCount={followerCount} />

      <CreatorTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        productCount={products.length}
        collectionCount={collections.length}
        postCount={posts.length}
      />

      <main className="container py-6 animate-fade-in">
        {activeTab === "products" && (
          productsLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="space-y-3">
                  <Skeleton className="aspect-square w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ))}
            </div>
          ) : (
            <ProductsGrid products={products} />
          )
        )}

        {activeTab === "collections" && (
          collectionsLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="space-y-3">
                  <Skeleton className="aspect-[4/3] w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              ))}
            </div>
          ) : (
            <CollectionsGrid collections={collections} />
          )
        )}

        {activeTab === "feed" && (
          postsLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="space-y-3">
                  <Skeleton className="aspect-square w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              ))}
            </div>
          ) : (
            <FeedGrid posts={posts} />
          )
        )}
      </main>
    </div>
  );
}
