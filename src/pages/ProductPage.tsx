import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { SiteHeader } from "@/components/site/SiteHeader";
import { FavoriteButton } from "@/components/ui/FavoriteButton";
import { FollowButton } from "@/components/ui/FollowButton";
import { ProductCard } from "@/components/creator/ProductCard";
import { ShareButtons } from "@/components/product/ShareButtons";
import { GoToStoreButton } from "@/components/product/GoToStoreButton";
import { AffiliateDisclosure } from "@/components/product/AffiliateDisclosure";
import { ProductSEO } from "@/components/seo/ProductSEO";
import { ImageLightbox, LazyImage } from "@/components/ui/ImageLightbox";
import { useProductBySlug, useRelatedProducts } from "@/hooks/useCreatorProducts";
import { toast } from "sonner";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

const monetizationLabels: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
  affiliate: { label: "Afiliado", variant: "default" },
  coupon: { label: "Cupom", variant: "secondary" },
  recommendation: { label: "Recomendação", variant: "outline" },
};

export default function ProductPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: product, isLoading, error } = useProductBySlug(slug);
  const { data: relatedProducts } = useRelatedProducts(
    product?.id || "",
    product?.creator_id || "",
    product?.categories
  );
  
  const [copiedCoupon, setCopiedCoupon] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const handleCopyCoupon = () => {
    if (product?.coupon_code) {
      navigator.clipboard.writeText(product.coupon_code);
      setCopiedCoupon(true);
      toast.success("Cupom copiado!");
      setTimeout(() => setCopiedCoupon(false), 2000);
    }
  };

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <main className="container max-w-6xl mx-auto px-4 py-8">
          <div className="grid lg:grid-cols-2 gap-8">
            <Skeleton className="aspect-square rounded-xl" />
            <div className="space-y-4">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <main className="container max-w-6xl mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">Produto não encontrado</h1>
          <p className="text-muted-foreground mb-6">
            Este produto não existe ou foi removido.
          </p>
          <Button asChild>
            <Link to="/">Voltar ao início</Link>
          </Button>
        </main>
      </div>
    );
  }

  const monetization = monetizationLabels[product.monetization_type || "affiliate"];
  const allImages = [product.image_url, ...(product.additional_images || [])].filter(Boolean) as string[];
  const creator = product.profiles;
  const productUrl = `${window.location.origin}/p/${product.slug}`;

  const formatPrice = (price: number, currency: string = "BRL") => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency,
    }).format(price);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* SEO Meta Tags */}
      <ProductSEO
        title={product.title}
        description={product.description || undefined}
        imageUrl={product.image_url || undefined}
        price={product.price || undefined}
        currency={product.currency || "BRL"}
        store={product.store || undefined}
        creatorName={creator?.name}
        url={productUrl}
      />

      <SiteHeader />
      
      <main className="container max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12">
          {/* Image Gallery */}
          <div className="space-y-4">
            {allImages.length > 1 ? (
              <Carousel className="w-full">
                <CarouselContent>
                  {allImages.map((url, index) => (
                    <CarouselItem key={index}>
                      <div
                        className="aspect-square rounded-xl overflow-hidden bg-secondary cursor-zoom-in"
                        onClick={() => openLightbox(index)}
                      >
                        <LazyImage
                          src={url}
                          alt={`${product.title} - Imagem ${index + 1}`}
                          className="h-full w-full"
                        />
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious className="left-2" />
                <CarouselNext className="right-2" />
              </Carousel>
            ) : (
              <div
                className="aspect-square rounded-xl overflow-hidden bg-secondary cursor-zoom-in"
                onClick={() => allImages.length > 0 && openLightbox(0)}
              >
                {product.image_url ? (
                  <LazyImage
                    src={product.image_url}
                    alt={product.title}
                    className="h-full w-full"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                    <svg className="h-24 w-24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
              </div>
            )}

            {/* Thumbnail strip */}
            {allImages.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {allImages.map((url, index) => (
                  <button
                    key={index}
                    className="w-16 h-16 rounded-md overflow-hidden bg-secondary flex-shrink-0 hover:ring-2 ring-primary transition-all"
                    onClick={() => openLightbox(index)}
                  >
                    <img src={url} alt="" className="h-full w-full object-cover" loading="lazy" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-4 sm:space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant={monetization.variant}>{monetization.label}</Badge>
                {product.store && (
                  <span className="text-sm text-muted-foreground">{product.store}</span>
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold">{product.title}</h1>
            </div>

            {product.price && (
              <p className="text-2xl sm:text-3xl font-bold text-primary">
                {formatPrice(product.price, product.currency || "BRL")}
              </p>
            )}

            {/* Categories */}
            {product.categories && product.categories.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {product.categories.map((category, index) => (
                  <Badge key={index} variant="outline">
                    {category}
                  </Badge>
                ))}
              </div>
            )}

            {/* Description */}
            {product.description && (
              <div className="prose prose-sm max-w-none">
                <p className="text-muted-foreground whitespace-pre-wrap">
                  {product.description}
                </p>
              </div>
            )}

            {/* Coupon Code */}
            {product.monetization_type === "coupon" && product.coupon_code && (
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="p-4">
                  <p className="text-sm font-medium mb-2">Código de desconto:</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 px-4 py-2 bg-background rounded-md font-mono text-lg">
                      {product.coupon_code}
                    </code>
                    <Button size="sm" variant="outline" onClick={handleCopyCoupon}>
                      {copiedCoupon ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Affiliate Disclosure */}
            <AffiliateDisclosure />

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <GoToStoreButton
                affiliateUrl={product.affiliate_url}
                productId={product.id}
                size="lg"
                className="flex-1"
              />
              <FavoriteButton productId={product.id} />
              <ShareButtons
                url={productUrl}
                title={product.title}
                description={product.description || undefined}
                compact
              />
            </div>

            {/* Share Options - Expanded */}
            <div>
              <p className="text-sm font-medium mb-2">Compartilhar:</p>
              <ShareButtons
                url={productUrl}
                title={product.title}
                description={product.description || undefined}
              />
            </div>

            <Separator />

            {/* Creator Info */}
            {creator && (
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <Link to={`/${creator.username}`}>
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={creator.avatar_url || undefined} />
                        <AvatarFallback>
                          {creator.name?.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </Link>
                    <div className="flex-1">
                      <Link
                        to={`/${creator.username}`}
                        className="font-medium hover:underline flex items-center gap-1"
                      >
                        {creator.name}
                        {creator.is_verified && (
                          <Badge variant="secondary" className="text-xs">✓</Badge>
                        )}
                      </Link>
                      <p className="text-sm text-muted-foreground">
                        @{creator.username}
                      </p>
                    </div>
                    <FollowButton creatorId={creator.id} />
                  </div>
                  {creator.bio && (
                    <p className="text-sm text-muted-foreground mt-3 line-clamp-2">
                      {creator.bio}
                    </p>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts && relatedProducts.length > 0 && (
          <section className="mt-12 sm:mt-16">
            <h2 className="text-lg sm:text-xl font-bold mb-4 sm:mb-6">Mais do mesmo criador</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {relatedProducts.map((relatedProduct) => (
                <ProductCard
                  key={relatedProduct.id}
                  product={relatedProduct}
                  variant="grid"
                  showStats={false}
                />
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Image Lightbox */}
      <ImageLightbox
        images={allImages}
        initialIndex={lightboxIndex}
        open={lightboxOpen}
        onOpenChange={setLightboxOpen}
        alt={product.title}
      />
    </div>
  );
}
