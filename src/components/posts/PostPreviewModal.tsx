import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Monitor, 
  Smartphone, 
  ArrowLeft, 
  ExternalLink,
  CheckCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Pin } from './PinEditor';

interface PostPreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageUrl: string;
  content: string;
  pins: Pin[];
  creator?: {
    name: string;
    username: string;
    avatar_url?: string | null;
  };
  onBack: () => void;
  onPublish: () => void;
  isPublishing?: boolean;
}

export function PostPreviewModal({
  open,
  onOpenChange,
  imageUrl,
  content,
  pins,
  creator,
  onBack,
  onPublish,
  isPublishing = false,
}: PostPreviewModalProps) {
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [highlightedPin, setHighlightedPin] = useState<string | null>(null);

  const formatPrice = (price: number | null | undefined, currency: string | null | undefined) => {
    if (!price) return null;
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currency || 'BRL'
    }).format(price);
  };

  const productsWithPins = pins.filter(pin => pin.product);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl h-[90vh] p-0 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Voltar
            </Button>
            <span className="text-sm text-muted-foreground">Preview do post</span>
          </div>

          <div className="flex items-center gap-4">
            {/* View mode toggle */}
            <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
              <Button
                variant={viewMode === 'desktop' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('desktop')}
              >
                <Monitor className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'mobile' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('mobile')}
              >
                <Smartphone className="w-4 h-4" />
              </Button>
            </div>

            <Button onClick={onPublish} disabled={isPublishing}>
              {isPublishing ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                  Publicando...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Publicar
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex items-center justify-center bg-muted/30 p-4">
          <div
            className={cn(
              'bg-background rounded-lg shadow-lg overflow-hidden transition-all duration-300',
              viewMode === 'desktop' ? 'w-full max-w-4xl' : 'w-[375px]'
            )}
          >
            <ScrollArea className="h-[calc(90vh-120px)]">
              {viewMode === 'desktop' ? (
                /* Desktop Layout - Split view */
                <div className="flex">
                  {/* Image side */}
                  <div className="w-[60%] relative">
                    <img
                      src={imageUrl}
                      alt="Post"
                      className="w-full h-auto"
                    />
                    {/* Pins */}
                    {pins.map((pin, index) => (
                      <div
                        key={pin.id}
                        className={cn(
                          'absolute w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transform -translate-x-1/2 -translate-y-1/2 transition-all cursor-pointer',
                          pin.product
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted-foreground text-muted',
                          highlightedPin === pin.id && 'scale-125 ring-4 ring-primary/50'
                        )}
                        style={{
                          left: `${pin.x * 100}%`,
                          top: `${pin.y * 100}%`,
                        }}
                        onMouseEnter={() => setHighlightedPin(pin.id)}
                        onMouseLeave={() => setHighlightedPin(null)}
                      >
                        {index + 1}
                      </div>
                    ))}
                  </div>

                  {/* Info side */}
                  <div className="w-[40%] border-l flex flex-col">
                    {/* Creator header */}
                    {creator && (
                      <div className="p-4 border-b flex items-center gap-3">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={creator.avatar_url || undefined} />
                          <AvatarFallback>{creator.name[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">{creator.name}</p>
                          <p className="text-xs text-muted-foreground">@{creator.username}</p>
                        </div>
                      </div>
                    )}

                    {/* Caption */}
                    {content && (
                      <div className="p-4 border-b">
                        <p className="text-sm whitespace-pre-wrap">{content}</p>
                      </div>
                    )}

                    {/* Products */}
                    <div className="flex-1 p-4">
                      <p className="text-sm font-medium mb-3">
                        Produtos neste post ({productsWithPins.length})
                      </p>
                      <div className="space-y-3">
                        {productsWithPins.map((pin, index) => (
                          <div
                            key={pin.id}
                            className={cn(
                              'flex items-center gap-3 p-2 rounded-lg transition-colors',
                              highlightedPin === pin.id && 'bg-primary/10'
                            )}
                            onMouseEnter={() => setHighlightedPin(pin.id)}
                            onMouseLeave={() => setHighlightedPin(null)}
                          >
                            <Badge variant="secondary" className="w-6 h-6 rounded-full flex items-center justify-center p-0">
                              {index + 1}
                            </Badge>
                            {pin.product?.image_url && (
                              <img
                                src={pin.product.image_url}
                                alt=""
                                className="w-12 h-12 rounded object-cover"
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{pin.product?.title}</p>
                              {pin.product?.price && (
                                <p className="text-xs text-muted-foreground">
                                  {formatPrice(pin.product.price, pin.product.currency)}
                                </p>
                              )}
                            </div>
                            <Button size="sm" variant="ghost">
                              <ExternalLink className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* Mobile Layout - Stacked */
                <div>
                  {/* Image with pins */}
                  <div className="relative">
                    <img
                      src={imageUrl}
                      alt="Post"
                      className="w-full h-auto"
                    />
                    {/* Pins */}
                    {pins.map((pin, index) => (
                      <div
                        key={pin.id}
                        className={cn(
                          'absolute w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transform -translate-x-1/2 -translate-y-1/2',
                          pin.product
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted-foreground text-muted'
                        )}
                        style={{
                          left: `${pin.x * 100}%`,
                          top: `${pin.y * 100}%`,
                        }}
                      >
                        {index + 1}
                      </div>
                    ))}
                  </div>

                  {/* Creator */}
                  {creator && (
                    <div className="p-4 border-b flex items-center gap-3">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={creator.avatar_url || undefined} />
                        <AvatarFallback>{creator.name[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">{creator.name}</p>
                        <p className="text-xs text-muted-foreground">@{creator.username}</p>
                      </div>
                    </div>
                  )}

                  {/* Caption */}
                  {content && (
                    <div className="p-4 border-b">
                      <p className="text-sm whitespace-pre-wrap">{content}</p>
                    </div>
                  )}

                  {/* Products */}
                  <div className="p-4">
                    <p className="text-sm font-medium mb-3">Produtos ({productsWithPins.length})</p>
                    <div className="space-y-2">
                      {productsWithPins.map((pin, index) => (
                        <div
                          key={pin.id}
                          className="flex items-center gap-3 p-2 border rounded-lg"
                        >
                          <Badge variant="secondary" className="w-5 h-5 rounded-full flex items-center justify-center p-0 text-xs">
                            {index + 1}
                          </Badge>
                          {pin.product?.image_url && (
                            <img
                              src={pin.product.image_url}
                              alt=""
                              className="w-10 h-10 rounded object-cover"
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{pin.product?.title}</p>
                            {pin.product?.price && (
                              <p className="text-xs text-muted-foreground">
                                {formatPrice(pin.product.price, pin.product.currency)}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
