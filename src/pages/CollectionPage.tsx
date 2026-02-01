import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, FolderOpen, Pencil, Plus } from "lucide-react";
import { SiteHeader } from "@/components/site/SiteHeader";
import { ProductsGrid } from "@/components/creator/ProductsGrid";
import { useCollection, useCollectionProducts } from "@/hooks/useCollection";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { normalizeUsername } from "@/lib/username";

export default function CollectionPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: collection, isLoading: collectionLoading } = useCollection(id || "");
  const { data: products = [], isLoading: productsLoading } = useCollectionProducts(id);

  if (collectionLoading) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <div className="container py-8">
          <Skeleton className="h-8 w-48 mb-4" />
          <Skeleton className="h-4 w-64 mb-8" />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="aspect-square w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!collection) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <div className="container py-16 text-center">
          <FolderOpen className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
          <h1 className="text-2xl font-sans font-semibold mb-2">Coleção não encontrada</h1>
          <p className="text-muted-foreground mb-6">
            Esta coleção não existe ou foi removida.
          </p>
          <Button asChild>
            <Link to="/">Voltar ao início</Link>
          </Button>
        </div>
      </div>
    );
  }

  const creator = collection.profiles as any;
  const creatorInitials = creator?.name
    ?.split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "?";

  // Check if current user is the owner
  const isOwner = user?.id && creator?.user_id === user.id;
  const creatorPath = `/${normalizeUsername(creator?.username)}`;

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <div className="container py-6">
        {/* Back Button */}
        {creator && (
          <Link
            to={creatorPath}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar para @{normalizeUsername(creator.username)}
          </Link>
        )}

        {/* Collection Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex items-center gap-4">
              {collection.thumbnail_url ? (
                <img
                  src={collection.thumbnail_url}
                  alt={collection.name}
                  className="h-16 w-16 rounded-xl object-cover"
                />
              ) : (
                <div className="h-16 w-16 rounded-xl bg-secondary flex items-center justify-center">
                  <FolderOpen className="h-8 w-8 text-muted-foreground" />
                </div>
              )}
              <div>
                <h1 className="text-2xl font-sans font-semibold">{collection.name}</h1>
                {collection.description && (
                  <p className="text-muted-foreground mt-1">{collection.description}</p>
                )}
              </div>
            </div>

            {/* Owner actions */}
            {isOwner && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/creator/collections/${id}/edit`)}
                >
                  <Pencil className="h-4 w-4 mr-2" />
                  Editar
                </Button>
                <Button
                  size="sm"
                  onClick={() => navigate("/creator/shop/new")}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar produto
                </Button>
              </div>
            )}
          </div>

          {/* Creator Info */}
          {creator && (
            <Link
              to={creatorPath}
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <Avatar className="h-6 w-6">
                <AvatarImage src={creator.avatar_url || undefined} />
                <AvatarFallback className="text-xs">{creatorInitials}</AvatarFallback>
              </Avatar>
              <span>por <span className="font-medium">{creator.name}</span></span>
            </Link>
          )}
        </div>

        {/* Products Grid */}
        <div className="mb-4">
          <p className="text-sm text-muted-foreground">
            {products.length} {products.length === 1 ? "produto" : "produtos"}
          </p>
        </div>

        {productsLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="aspect-square w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <FolderOpen className="h-16 w-16 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-sans font-medium mb-1">Nenhum produto ainda</h3>
            <p className="text-muted-foreground text-sm mb-4">
              Esta coleção ainda não tem produtos.
            </p>
            {isOwner && (
              <Button onClick={() => navigate("/creator/shop/new")}>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar primeiro produto
              </Button>
            )}
          </div>
        ) : (
          <ProductsGrid products={products} />
        )}
      </div>
    </div>
  );
}
