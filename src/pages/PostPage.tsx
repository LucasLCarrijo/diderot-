import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { SiteHeader } from '@/components/site/SiteHeader';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { FollowButton } from '@/components/ui/FollowButton';
import { SharePostButtons } from '@/components/posts/SharePostButtons';
import { 
  ExternalLink, 
  MapPin,
  ChevronRight,
  ArrowLeft,
  BadgeCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePost } from '@/hooks/usePosts';
import { useTrackProductClick } from '@/hooks/useCreatorProducts';

export default function PostPage() {
  const { id } = useParams<{ id: string }>();
  const { data: post, isLoading, error } = usePost(id);
  const trackClick = useTrackProductClick();
  
  const [highlightedPin, setHighlightedPin] = useState<string | null>(null);

  const formatPrice = (price: number | null | undefined, currency: string | null | undefined) => {
    if (!price) return null;
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currency || 'BRL'
    }).format(price);
  };

  const handleProductClick = (productId: string) => {
    trackClick.mutate(productId);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <main className="container max-w-6xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            <div className="lg:col-span-3">
              <Skeleton className="aspect-square rounded-lg" />
            </div>
            <div className="lg:col-span-2 space-y-4">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-48 w-full" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <main className="container max-w-6xl mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">Post não encontrado</h1>
          <p className="text-muted-foreground mb-6">
            Este post pode ter sido removido ou o link está incorreto.
          </p>
          <Button asChild>
            <Link to="/">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar para home
            </Link>
          </Button>
        </main>
      </div>
    );
  }

  const productsWithPins = post.pins?.filter(pin => pin.product) || [];

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      
      <main className="container max-w-6xl mx-auto px-4 py-8">
        {/* Back button */}
        {post.creator && (
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="mb-6"
          >
            <Link to={`/${post.creator.username}`}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar para @{post.creator.username}
            </Link>
          </Button>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Image with pins */}
          <div className="lg:col-span-3">
            <div className="relative rounded-lg overflow-hidden bg-muted sticky top-4">
              <img
                src={post.image_url}
                alt={post.title || 'Post'}
                className="w-full h-auto"
                loading="lazy"
              />
              
              {/* Pins */}
              {post.pins?.map((pin, index) => (
                <button
                  key={pin.id}
                  className={cn(
                    'absolute w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center text-xs md:text-sm font-bold transform -translate-x-1/2 -translate-y-1/2 transition-all cursor-pointer shadow-lg',
                    pin.product
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted-foreground text-muted',
                    highlightedPin === pin.id && 'scale-125 ring-4 ring-primary/50 z-10'
                  )}
                  style={{
                    left: `${pin.x * 100}%`,
                    top: `${pin.y * 100}%`,
                  }}
                  onMouseEnter={() => setHighlightedPin(pin.id)}
                  onMouseLeave={() => setHighlightedPin(null)}
                  onClick={() => {
                    const element = document.getElementById(`product-${pin.id}`);
                    element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    setHighlightedPin(pin.id);
                    setTimeout(() => setHighlightedPin(null), 2000);
                  }}
                >
                  {/* Pulse animation */}
                  {pin.product && highlightedPin !== pin.id && (
                    <span className="absolute inset-0 rounded-full bg-primary animate-ping opacity-20" />
                  )}
                  {index + 1}
                </button>
              ))}
            </div>

            {/* Mobile: Caption below image */}
            <div className="lg:hidden mt-4 space-y-4">
              {/* Creator */}
              {post.creator && (
                <div className="flex items-center justify-between">
                  <Link 
                    to={`/${post.creator.username}`}
                    className="flex items-center gap-3"
                  >
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={post.creator.avatar_url || undefined} />
                      <AvatarFallback>{post.creator.name[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-1">
                        <span className="font-medium text-sm">{post.creator.name}</span>
                        {post.creator.is_verified && (
                          <BadgeCheck className="w-4 h-4 text-primary" />
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">@{post.creator.username}</span>
                    </div>
                  </Link>
                  <FollowButton creatorId={post.creator.id} />
                </div>
              )}

              {/* Caption */}
              {post.content && (
                <p className="text-sm whitespace-pre-wrap">{post.content}</p>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-2 space-y-6">
            {/* Desktop: Creator header */}
            <div className="hidden lg:block">
              {post.creator && (
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <Link 
                        to={`/${post.creator.username}`}
                        className="flex items-center gap-3"
                      >
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={post.creator.avatar_url || undefined} />
                          <AvatarFallback>{post.creator.name[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-1">
                            <span className="font-semibold">{post.creator.name}</span>
                            {post.creator.is_verified && (
                              <BadgeCheck className="w-4 h-4 text-primary" />
                            )}
                          </div>
                          <span className="text-sm text-muted-foreground">@{post.creator.username}</span>
                        </div>
                      </Link>
                      <FollowButton creatorId={post.creator.id} />
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Desktop: Caption */}
            {post.content && (
              <Card className="hidden lg:block">
                <CardContent className="p-4">
                  <p className="text-sm whitespace-pre-wrap">{post.content}</p>
                </CardContent>
              </Card>
            )}

            {/* Products list */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-4">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">
                    Produtos ({productsWithPins.length})
                  </span>
                </div>
                
                {productsWithPins.length > 0 ? (
                  <div className="space-y-3">
                    {productsWithPins.map((pin, index) => (
                      <div
                        key={pin.id}
                        id={`product-${pin.id}`}
                        className={cn(
                          'flex items-center gap-3 p-2 rounded-lg transition-all',
                          highlightedPin === pin.id && 'bg-primary/10 ring-2 ring-primary'
                        )}
                        onMouseEnter={() => setHighlightedPin(pin.id)}
                        onMouseLeave={() => setHighlightedPin(null)}
                      >
                        <Badge 
                          variant="secondary" 
                          className="w-6 h-6 rounded-full flex items-center justify-center p-0 shrink-0"
                        >
                          {index + 1}
                        </Badge>
                        
                        {pin.product?.image_url ? (
                          <img
                            src={pin.product.image_url}
                            alt=""
                            className="w-14 h-14 rounded object-cover shrink-0"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-14 h-14 rounded bg-muted flex items-center justify-center shrink-0">
                            <MapPin className="w-5 h-5 text-muted-foreground" />
                          </div>
                        )}
                        
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{pin.product?.title}</p>
                          {pin.product?.store && (
                            <p className="text-xs text-muted-foreground">{pin.product.store}</p>
                          )}
                          {pin.product?.price && (
                            <p className="text-sm font-medium text-primary mt-1">
                              {formatPrice(pin.product.price, pin.product.currency)}
                            </p>
                          )}
                        </div>
                        
                        <Button
                          size="sm"
                          variant="outline"
                          asChild
                          onClick={() => pin.product && handleProductClick(pin.product.id)}
                        >
                          <Link to={`/p/${pin.product?.slug}`}>
                            <ChevronRight className="w-4 h-4" />
                          </Link>
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nenhum produto marcado neste post
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Share */}
            <Card>
              <CardContent className="p-4">
                <p className="font-medium mb-3">Compartilhar</p>
                <SharePostButtons
                  postId={post.id}
                  creatorUsername={post.creator?.username || 'creator'}
                  imageUrl={post.image_url}
                  caption={post.content || undefined}
                />
              </CardContent>
            </Card>

            {/* Post info */}
            <p className="text-xs text-muted-foreground text-center">
              Publicado em {new Date(post.created_at).toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: 'long',
                year: 'numeric',
              })}
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
