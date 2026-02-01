import { Link } from "react-router-dom";
import { ExternalLink, Clock, TrendingUp } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { FavoriteButton } from "@/components/ui/FavoriteButton";
import { handleProductClick } from "@/lib/tracking";
import { useAuth } from "@/contexts/AuthContext";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Creator {
  id: string;
  username: string;
  name: string;
  avatar_url: string | null;
  is_verified?: boolean;
}

interface FeedProduct {
  id: string;
  title: string;
  image_url: string | null;
  affiliate_url: string;
  price: number | null;
  currency: string | null;
  categories: string[] | null;
  click_count: number | null;
  favorite_count: number | null;
  created_at: string;
  coupon_code?: string | null;
  slug?: string | null;
  creator: Creator;
  isFromFollowed?: boolean;
  isNew?: boolean;
  isTrending?: boolean;
}

interface FeedCardProps {
  product: FeedProduct;
  showBadges?: boolean;
}

export function FeedCard({ product, showBadges = true }: FeedCardProps) {
  const { user } = useAuth();

  const formatPrice = (price: number | null, currency: string | null) => {
    if (!price) return null;
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: currency || "BRL",
    }).format(price);
  };

  const isNewProduct = () => {
    const createdAt = new Date(product.created_at);
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    return createdAt > oneDayAgo;
  };

  const productUrl = product.slug ? `/p/${product.slug}` : null;

  return (
    <div className="group product-card bg-card rounded-lg overflow-hidden border border-border/50 hover:border-border transition-all duration-200 hover:shadow-lg">
      {productUrl ? (
        <Link to={productUrl} className="block">
          <div className="aspect-square overflow-hidden bg-secondary relative">
            {product.image_url ? (
              <img
                src={product.image_url}
                alt={product.title}
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                <svg
                  className="h-12 w-12"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
            )}

            {/* Badges */}
            {showBadges && (
              <div className="absolute top-2 left-2 flex flex-col gap-1">
                {(product.isNew || isNewProduct()) && (
                  <Badge className="bg-green-500 text-white text-[10px] px-1.5 py-0.5">
                    <Clock className="h-3 w-3 mr-0.5" />
                    Novo
                  </Badge>
                )}
                {product.isTrending && (
                  <Badge className="bg-orange-500 text-white text-[10px] px-1.5 py-0.5">
                    <TrendingUp className="h-3 w-3 mr-0.5" />
                    Trending
                  </Badge>
                )}
                {product.coupon_code && (
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5">
                    Cupom
                  </Badge>
                )}
              </div>
            )}

            {/* Favorite button */}
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <FavoriteButton productId={product.id} size="sm" />
            </div>
          </div>
        </Link>
      ) : (
        <a
          href={product.affiliate_url}
          onClick={(e) =>
            handleProductClick(product.affiliate_url, product.id, { userId: user?.id, event: e })
          }
          className="block"
        >
          <div className="aspect-square overflow-hidden bg-secondary relative">
            {product.image_url ? (
              <img
                src={product.image_url}
                alt={product.title}
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                <svg
                  className="h-12 w-12"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
            )}

            {/* Badges */}
            {showBadges && (
              <div className="absolute top-2 left-2 flex flex-col gap-1">
                {(product.isNew || isNewProduct()) && (
                  <Badge className="bg-green-500 text-white text-[10px] px-1.5 py-0.5">
                    <Clock className="h-3 w-3 mr-0.5" />
                    Novo
                  </Badge>
                )}
                {product.isTrending && (
                  <Badge className="bg-orange-500 text-white text-[10px] px-1.5 py-0.5">
                    <TrendingUp className="h-3 w-3 mr-0.5" />
                    Trending
                  </Badge>
                )}
                {product.coupon_code && (
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5">
                    Cupom
                  </Badge>
                )}
              </div>
            )}

            {/* Favorite button */}
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <FavoriteButton productId={product.id} size="sm" />
            </div>
          </div>
        </a>
      )}

      <div className="p-2 sm:p-3 space-y-1.5 sm:space-y-2">
        <Link
          to={`/${product.creator.username}`}
          className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <Avatar className="h-5 w-5">
            <AvatarImage src={product.creator.avatar_url || undefined} />
            <AvatarFallback className="text-[10px]">
              {product.creator.name?.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <span className="flex items-center gap-1">
            @{product.creator.username}
            {product.creator.is_verified && (
              <svg
                className="h-3 w-3 text-primary"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </span>
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
            onClick={(e) =>
              handleProductClick(product.affiliate_url, product.id, { userId: user?.id, event: e })
            }
          >
            <h3 className="font-medium text-sm line-clamp-2 group-hover:underline">
              {product.title}
            </h3>
          </a>
        )}

        <div className="flex items-center justify-between">
          <div>
            {product.price && (
              <p className="font-semibold text-sm">
                {formatPrice(product.price, product.currency)}
              </p>
            )}
            <p className="text-[10px] text-muted-foreground">
              {formatDistanceToNow(new Date(product.created_at), {
                addSuffix: true,
                locale: ptBR,
              })}
            </p>
          </div>
          <ExternalLink className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>
    </div>
  );
}
