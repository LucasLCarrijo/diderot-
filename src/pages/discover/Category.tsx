import { useParams, Link } from "react-router-dom";
import { SiteHeader } from "@/components/site/SiteHeader";
import { FeedCard } from "@/components/feed/FeedCard";
import { FeedSkeleton } from "@/components/feed/FeedSkeleton";
import { EmptyFeed } from "@/components/feed/EmptyFeed";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft } from "lucide-react";

const CATEGORY_INFO: Record<string, { title: string; description: string; emoji: string }> = {
  fashion: { title: "Fashion", description: "Moda, roupas e acessórios", emoji: "👗" },
  beauty: { title: "Beauty", description: "Beleza, skincare e maquiagem", emoji: "💄" },
  tech: { title: "Tech", description: "Tecnologia, gadgets e eletrônicos", emoji: "📱" },
  home: { title: "Home", description: "Casa, decoração e organização", emoji: "🏠" },
  fitness: { title: "Fitness", description: "Fitness, esportes e bem-estar", emoji: "💪" },
  food: { title: "Food", description: "Comida, receitas e utensílios", emoji: "🍕" },
};

export default function CategoryDiscover() {
  const { category } = useParams<{ category: string }>();
  const info = CATEGORY_INFO[category || ""] || { title: category, description: "", emoji: "📦" };

  const { data: products, isLoading } = useQuery({
    queryKey: ["category-products", category],
    queryFn: async () => {
      const { data } = await supabase
        .from("products")
        .select(`
          id, title, image_url, affiliate_url, price, currency,
          categories, click_count, favorite_count, created_at, coupon_code, slug,
          profiles:creator_id (id, username, name, avatar_url, is_verified)
        `)
        .eq("is_published", true)
        .contains("categories", [info.title])
        .order("created_at", { ascending: false })
        .limit(50);
      return (data || []).map((p) => ({ ...p, creator: p.profiles as any }));
    },
    enabled: !!category,
  });

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="container py-8">
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link to="/"><ArrowLeft className="h-4 w-4 mr-2" />Voltar</Link>
        </Button>

        <div className="mb-8 text-center">
          <span className="text-5xl mb-4 block">{info.emoji}</span>
          <h1 className="text-3xl font-sans font-semibold">{info.title}</h1>
          <p className="text-muted-foreground">{info.description}</p>
        </div>

        {isLoading ? (
          <FeedSkeleton count={12} />
        ) : products && products.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {products.map((product) => (
              <FeedCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <EmptyFeed type="search" searchQuery={info.title} />
        )}
      </main>
    </div>
  );
}
