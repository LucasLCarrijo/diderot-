import { useState, useEffect, useCallback } from "react";
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface ImageLightboxProps {
  images: string[];
  initialIndex?: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  alt?: string;
}

export function ImageLightbox({
  images,
  initialIndex = 0,
  open,
  onOpenChange,
  alt = "Image",
}: ImageLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [zoom, setZoom] = useState(1);

  // Reset state when opening
  useEffect(() => {
    if (open) {
      setCurrentIndex(initialIndex);
      setZoom(1);
    }
  }, [open, initialIndex]);

  const goToPrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
    setZoom(1);
  }, [images.length]);

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
    setZoom(1);
  }, [images.length]);

  const toggleZoom = useCallback(() => {
    setZoom((prev) => (prev === 1 ? 2 : 1));
  }, []);

  // Keyboard navigation
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowLeft":
          goToPrevious();
          break;
        case "ArrowRight":
          goToNext();
          break;
        case "Escape":
          onOpenChange(false);
          break;
        case " ":
          e.preventDefault();
          toggleZoom();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, goToPrevious, goToNext, onOpenChange, toggleZoom]);

  if (!images.length) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] w-full h-full p-0 bg-black/95 border-none">
        <div className="relative h-full flex flex-col">
          {/* Header */}
          <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4 bg-gradient-to-b from-black/50 to-transparent">
            <div className="text-white text-sm">
              {images.length > 1 && `${currentIndex + 1} / ${images.length}`}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20"
                onClick={toggleZoom}
              >
                {zoom === 1 ? (
                  <ZoomIn className="h-5 w-5" />
                ) : (
                  <ZoomOut className="h-5 w-5" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20"
                onClick={() => onOpenChange(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Image Container */}
          <div className="flex-1 flex items-center justify-center overflow-hidden">
            <img
              src={images[currentIndex]}
              alt={`${alt} ${currentIndex + 1}`}
              className={cn(
                "max-h-full max-w-full object-contain transition-transform duration-200",
                zoom > 1 && "cursor-zoom-out"
              )}
              style={{ transform: `scale(${zoom})` }}
              onClick={toggleZoom}
              loading="lazy"
            />
          </div>

          {/* Navigation Arrows */}
          {images.length > 1 && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 h-12 w-12"
                onClick={goToPrevious}
              >
                <ChevronLeft className="h-8 w-8" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 h-12 w-12"
                onClick={goToNext}
              >
                <ChevronRight className="h-8 w-8" />
              </Button>
            </>
          )}

          {/* Thumbnails */}
          {images.length > 1 && (
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/50 to-transparent">
              <div className="flex justify-center gap-2 overflow-x-auto">
                {images.map((img, index) => (
                  <button
                    key={index}
                    className={cn(
                      "w-16 h-16 rounded-md overflow-hidden flex-shrink-0 border-2 transition-all",
                      index === currentIndex
                        ? "border-white"
                        : "border-transparent opacity-60 hover:opacity-100"
                    )}
                    onClick={() => {
                      setCurrentIndex(index);
                      setZoom(1);
                    }}
                  >
                    <img
                      src={img}
                      alt=""
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// LazyImage component for optimized loading
interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  placeholderClassName?: string;
  onClick?: () => void;
}

export function LazyImage({
  src,
  alt,
  className,
  placeholderClassName,
  onClick,
}: LazyImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  return (
    <div className={cn("relative overflow-hidden", className)} onClick={onClick}>
      {/* Placeholder */}
      {!loaded && !error && (
        <div
          className={cn(
            "absolute inset-0 bg-secondary animate-pulse",
            placeholderClassName
          )}
        />
      )}

      {/* Error state */}
      {error && (
        <div className="absolute inset-0 bg-secondary flex items-center justify-center text-muted-foreground">
          <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
      )}

      <img
        src={src}
        alt={alt}
        className={cn(
          "h-full w-full object-cover transition-opacity duration-300",
          loaded ? "opacity-100" : "opacity-0"
        )}
        loading="lazy"
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
      />
    </div>
  );
}
