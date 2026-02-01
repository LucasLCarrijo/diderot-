import React, { useState, useRef, useCallback, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { X, Move, Package, GripVertical, Edit2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export interface Pin {
  id: string;
  x: number;
  y: number;
  productId: string;
  label?: string;
  product?: {
    id: string;
    title: string;
    image_url: string | null;
    price: number | null;
    currency: string | null;
  };
}

interface PinEditorProps {
  imageUrl: string;
  pins: Pin[];
  onPinsChange: (pins: Pin[]) => void;
  onAddPin: (x: number, y: number) => void;
  onEditPin?: (pinId: string) => void;
  maxPins?: number;
  editable?: boolean;
  className?: string;
  showSidebar?: boolean;
}

export function PinEditor({
  imageUrl,
  pins,
  onPinsChange,
  onAddPin,
  onEditPin,
  maxPins = 20,
  editable = true,
  className,
  showSidebar = true,
}: PinEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [draggingPin, setDraggingPin] = useState<string | null>(null);
  const [selectedPin, setSelectedPin] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [showCoords, setShowCoords] = useState(false);

  const handleContainerClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!editable || draggingPin) return;
    
    const target = e.target as HTMLElement;
    if (target.closest('[data-pin]')) return;

    if (pins.length >= maxPins) {
      return;
    }

    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;

    onAddPin(Math.max(0, Math.min(1, x)), Math.max(0, Math.min(1, y)));
  }, [editable, draggingPin, pins.length, maxPins, onAddPin]);

  const handlePinMouseDown = useCallback((e: React.MouseEvent, pinId: string) => {
    if (!editable) return;
    e.stopPropagation();
    e.preventDefault();
    
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const pin = pins.find(p => p.id === pinId);
    if (!pin) return;

    // Calculate offset from pin center
    const pinX = pin.x * rect.width;
    const pinY = pin.y * rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    setDragOffset({ x: mouseX - pinX, y: mouseY - pinY });
    setDraggingPin(pinId);
    setSelectedPin(pinId);
  }, [editable, pins]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!draggingPin || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left - dragOffset.x) / rect.width;
    const y = (e.clientY - rect.top - dragOffset.y) / rect.height;

    const updatedPins = pins.map(pin =>
      pin.id === draggingPin
        ? { ...pin, x: Math.max(0, Math.min(1, x)), y: Math.max(0, Math.min(1, y)) }
        : pin
    );

    onPinsChange(updatedPins);
  }, [draggingPin, dragOffset, pins, onPinsChange]);

  const handleMouseUp = useCallback(() => {
    setDraggingPin(null);
    setDragOffset({ x: 0, y: 0 });
  }, []);

  // Global mouse events for dragging
  useEffect(() => {
    if (draggingPin) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [draggingPin, handleMouseMove, handleMouseUp]);

  const handleRemovePin = useCallback((pinId: string) => {
    const updatedPins = pins.filter(pin => pin.id !== pinId);
    onPinsChange(updatedPins);
    if (selectedPin === pinId) setSelectedPin(null);
  }, [pins, onPinsChange, selectedPin]);

  const handleReorderPins = useCallback((fromIndex: number, toIndex: number) => {
    const newPins = [...pins];
    const [removed] = newPins.splice(fromIndex, 1);
    newPins.splice(toIndex, 0, removed);
    onPinsChange(newPins);
  }, [pins, onPinsChange]);

  const formatPrice = (price: number | null | undefined, currency: string | null | undefined) => {
    if (!price) return null;
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currency || 'BRL'
    }).format(price);
  };

  return (
    <TooltipProvider>
      <div className={cn('flex gap-4', className)}>
        {/* Main canvas */}
        <div
          ref={containerRef}
          className={cn(
            'relative overflow-hidden rounded-lg select-none flex-1',
            editable && 'cursor-crosshair',
            draggingPin && 'cursor-grabbing'
          )}
          onClick={handleContainerClick}
        >
          {/* Image */}
          <img
            src={imageUrl}
            alt="Post"
            className="w-full h-auto object-contain"
            draggable={false}
          />

          {/* Pins Overlay */}
          {pins.map((pin, index) => (
            <Tooltip key={pin.id}>
              <TooltipTrigger asChild>
                <div
                  data-pin
                  className={cn(
                    'absolute transform -translate-x-1/2 -translate-y-1/2 z-10 transition-transform',
                    draggingPin === pin.id && 'z-20 scale-110'
                  )}
                  style={{
                    left: `${pin.x * 100}%`,
                    top: `${pin.y * 100}%`,
                  }}
                >
                  {/* Pin visual */}
                  <div
                    className={cn(
                      'relative group',
                      editable && !draggingPin && 'cursor-grab',
                      draggingPin === pin.id && 'cursor-grabbing'
                    )}
                    onMouseDown={(e) => handlePinMouseDown(e, pin.id)}
                  >
                    {/* Pin circle with pulse animation */}
                    <div
                      className={cn(
                        'w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all shadow-lg relative',
                        pin.product
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted-foreground text-muted',
                        selectedPin === pin.id && 'ring-4 ring-primary/50 scale-110',
                        draggingPin === pin.id && 'opacity-80'
                      )}
                    >
                      {/* Pulse effect */}
                      {pin.product && !draggingPin && (
                        <span className="absolute inset-0 rounded-full bg-primary animate-ping opacity-20" />
                      )}
                      
                      {pin.product ? (
                        index + 1
                      ) : (
                        <Package className="w-4 h-4" />
                      )}
                    </div>

                    {/* Product mini thumbnail */}
                    {pin.product?.image_url && (
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full overflow-hidden border-2 border-background shadow-md">
                        <img
                          src={pin.product.image_url}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}

                    {/* Remove button (editable mode) */}
                    {editable && !draggingPin && (
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute -top-2 -right-2 w-5 h-5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemovePin(pin.id);
                        }}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    )}

                    {/* Drag indicator */}
                    {editable && !draggingPin && (
                      <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Move className="w-3 h-3 text-muted-foreground" />
                      </div>
                    )}

                    {/* Coordinates tooltip (debug mode) */}
                    {showCoords && draggingPin === pin.id && (
                      <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2 py-1 bg-black/80 text-white text-xs rounded whitespace-nowrap">
                        x: {(pin.x * 100).toFixed(1)}%, y: {(pin.y * 100).toFixed(1)}%
                      </div>
                    )}
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs">
                {pin.product ? (
                  <div className="flex items-center gap-2">
                    {pin.product.image_url && (
                      <img
                        src={pin.product.image_url}
                        alt=""
                        className="w-10 h-10 rounded object-cover"
                      />
                    )}
                    <div>
                      <p className="font-medium text-sm">{pin.product.title}</p>
                      {pin.product.price && (
                        <p className="text-xs text-muted-foreground">
                          {formatPrice(pin.product.price, pin.product.currency)}
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm">Clique para selecionar um produto</p>
                )}
              </TooltipContent>
            </Tooltip>
          ))}

          {/* Instructions overlay (when no pins) */}
          {editable && pins.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 pointer-events-none">
              <div className="bg-background/95 backdrop-blur-sm rounded-xl px-6 py-4 text-center shadow-xl">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <Package className="w-6 h-6 text-primary" />
                </div>
                <p className="font-medium">Clique na imagem para adicionar produtos</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Máximo de {maxPins} pins por post
                </p>
              </div>
            </div>
          )}

          {/* Pin count indicator */}
          {editable && pins.length > 0 && (
            <Badge 
              variant="secondary" 
              className="absolute bottom-3 right-3 shadow-md"
            >
              {pins.length}/{maxPins} pins
            </Badge>
          )}
        </div>

        {/* Sidebar for pin management */}
        {editable && showSidebar && pins.length > 0 && (
          <Card className="w-64 shrink-0">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center justify-between">
                Produtos no post
                <Badge variant="outline" className="ml-2">
                  {pins.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[300px]">
                <div className="space-y-1 p-3 pt-0">
                  {pins.map((pin, index) => (
                    <div
                      key={pin.id}
                      className={cn(
                        'flex items-center gap-2 p-2 rounded-lg transition-colors cursor-pointer',
                        selectedPin === pin.id 
                          ? 'bg-primary/10 ring-1 ring-primary' 
                          : 'hover:bg-muted'
                      )}
                      onClick={() => setSelectedPin(pin.id)}
                    >
                      {/* Drag handle */}
                      <GripVertical className="w-4 h-4 text-muted-foreground shrink-0 cursor-grab" />
                      
                      {/* Number */}
                      <Badge 
                        variant={pin.product ? 'default' : 'secondary'}
                        className="w-6 h-6 rounded-full flex items-center justify-center p-0 shrink-0"
                      >
                        {index + 1}
                      </Badge>
                      
                      {/* Thumbnail */}
                      {pin.product?.image_url ? (
                        <img
                          src={pin.product.image_url}
                          alt=""
                          className="w-8 h-8 rounded object-cover shrink-0"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded bg-muted flex items-center justify-center shrink-0">
                          <Package className="w-4 h-4 text-muted-foreground" />
                        </div>
                      )}
                      
                      {/* Title */}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">
                          {pin.product?.title || 'Selecionar produto'}
                        </p>
                      </div>
                      
                      {/* Actions */}
                      <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        {onEditPin && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={(e) => {
                              e.stopPropagation();
                              onEditPin(pin.id);
                            }}
                          >
                            <Edit2 className="w-3 h-3" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-destructive hover:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemovePin(pin.id);
                          }}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        )}
      </div>
    </TooltipProvider>
  );
}
