import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { UserLayout } from "@/components/layout/UserLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useAdvancedFeed } from "@/hooks/useAdvancedFeed";
import { FeedFilters, FeedFiltersState, defaultFeedFilters } from "@/components/feed/FeedFilters";
import { FeedCard } from "@/components/feed/FeedCard";
import { FeedSkeleton } from "@/components/feed/FeedSkeleton";
import { EmptyFeed } from "@/components/feed/EmptyFeed";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Filter } from "lucide-react";

type FeedTab = "for_you" | "following" | "trending";

export default function Feed() {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<FeedTab>("for_you");
  const [filters, setFilters] = useState<FeedFiltersState>(defaultFeedFilters);
  const { data: products, isLoading } = useAdvancedFeed(activeTab, filters);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth/signin");
    }
  }, [user, authLoading, navigate]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <UserLayout title="Meu Feed" description="Produtos dos creators que você segue">
      <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block w-64 shrink-0">
          <div className="sticky top-24">
            <FeedFilters filters={filters} onFiltersChange={setFilters} />
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {/* Tabs */}
          <div className="flex items-center justify-between mb-6">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as FeedTab)}>
              <TabsList>
                <TabsTrigger value="for_you">Para você</TabsTrigger>
                <TabsTrigger value="following">Seguindo</TabsTrigger>
                <TabsTrigger value="trending">Trending</TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Mobile Filter Button */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="lg:hidden">
                  <Filter className="h-4 w-4 mr-2" />
                  Filtros
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80">
                <FeedFilters filters={filters} onFiltersChange={setFilters} />
              </SheetContent>
            </Sheet>
          </div>

          {/* Feed Content */}
          {isLoading ? (
            <FeedSkeleton count={8} />
          ) : products && products.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
              {products.map((product) => (
                <FeedCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <EmptyFeed type={activeTab} />
          )}
        </div>
      </div>
    </UserLayout>
  );
}
