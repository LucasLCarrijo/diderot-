import { useState } from "react";
import { X, Monitor, Smartphone, Pencil, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface ProductData {
  title: string;
  description?: string;
  image_url?: string;
  additional_images?: string[];
  store?: string;
  price?: number;
  currency?: string;
  monetization_type?: string;
  coupon_code?: string;
  categories?: string[];
}

interface ProductPreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: ProductData;
  onEdit: () => void;
  onPublish: () => void;
  isPublishing?: boolean;
}

const monetizationLabels: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
  affiliate: { label: "Afiliado", variant: "default" },
  coupon: { label: "Cupom", variant: "secondary" },
  recommendation: { label: "Recomendação", variant: "outline" },
};

export function ProductPreviewModal({
  open,
  onOpenChange,
  product,
  onEdit,
  onPublish,
  isPublishing = false,
}: ProductPreviewModalProps) {
  const [viewMode, setViewMode] = useState<"desktop" | "mobile">("desktop");

  const formatPrice = (price: number, currency: string = "BRL") => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency,
    }).format(price);
  };

  const monetization = monetizationLabels[product.monetization_type || "affiliate"];
  const allImages = [product.image_url, ...(product.additional_images || [])].filter(Boolean) as string[];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 py-4 border-b flex-shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle>Preview do Produto</DialogTitle>
            <div className="flex items-center gap-2">
              <div className="flex border rounded-md">
                <Button
                  variant={viewMode === "desktop" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("desktop")}
                >
                  <Monitor className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "mobile" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("mobile")}
                >
                  <Smartphone className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </DialogHeader>

        {/* Preview Area */}
        <div className="flex-1 overflow-auto bg-muted/30 p-6 flex justify-center">
          <div
            className={cn(
              "bg-background rounded-lg shadow-lg overflow-hidden transition-all",
              viewMode === "desktop" ? "w-full max-w-4xl" : "w-[375px]"
            )}
          >
            <div className={cn(
              "grid gap-6 p-6",
              viewMode === "desktop" ? "grid-cols-2" : "grid-cols-1"
            )}>
              {/* Image */}
              <div className="space-y-4">
                <div className="aspect-square rounded-xl overflow-hidden bg-secondary">
                  {allImages[0] ? (
                    <img
                      src={allImages[0]}
                      alt={product.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                      <svg className="h-16 w-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                </div>

                {allImages.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto">
                    {allImages.map((url, i) => (
                      <div key={i} className="w-16 h-16 rounded-md overflow-hidden bg-secondary flex-shrink-0">
                        <img src={url} alt="" className="h-full w-full object-cover" />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant={monetization.variant}>{monetization.label}</Badge>
                    {product.store && (
                      <span className="text-sm text-muted-foreground">{product.store}</span>
                    )}
                  </div>
                  <h2 className="text-xl font-bold">{product.title}</h2>
                </div>

                {product.price && (
                  <p className="text-2xl font-bold text-primary">
                    {formatPrice(product.price, product.currency || "BRL")}
                  </p>
                )}

                {product.categories && product.categories.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {product.categories.map((cat, i) => (
                      <Badge key={i} variant="outline">{cat}</Badge>
                    ))}
                  </div>
                )}

                {product.description && (
                  <p className="text-muted-foreground text-sm whitespace-pre-wrap">
                    {product.description}
                  </p>
                )}

                {product.monetization_type === "coupon" && product.coupon_code && (
                  <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                    <p className="text-sm font-medium mb-2">Código de desconto:</p>
                    <code className="block px-4 py-2 bg-background rounded-md font-mono text-lg">
                      {product.coupon_code}
                    </code>
                  </div>
                )}

                <Button size="lg" className="w-full">
                  Ir à Loja
                </Button>

                <p className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg">
                  ⚠️ Este link pode conter código de afiliado. O criador pode receber uma
                  comissão se você realizar uma compra através deste link.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 py-4 border-t flex justify-end gap-3 flex-shrink-0">
          <Button variant="outline" onClick={onEdit}>
            <Pencil className="h-4 w-4 mr-2" />
            Editar
          </Button>
          <Button onClick={onPublish} disabled={isPublishing}>
            <Check className="h-4 w-4 mr-2" />
            {isPublishing ? "Publicando..." : "Publicar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
