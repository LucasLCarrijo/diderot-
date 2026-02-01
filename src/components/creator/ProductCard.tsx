import { Link } from "react-router-dom";
import { ExternalLink, Heart, MousePointerClick, Eye, MoreVertical, Pencil, Trash2, Copy, Files } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export interface ProductCardData {
  id: string;
  title: string;
  image_url?: string | null;
  affiliate_url: string;
  price?: number | null;
  currency?: string | null;
  categories?: string[] | null;
  click_count?: number | null;
  favorite_count?: number | null;
  status?: string | null;
  monetization_type?: string | null;
  store?: string | null;
  slug?: string | null;
  is_published?: boolean | null;
}

interface ProductCardProps {
  product: ProductCardData;
  variant?: "grid" | "list" | "compact";
  showActions?: boolean;
  showStats?: boolean;
  onEdit?: (product: ProductCardData) => void;
  onDelete?: (id: string) => void;
  onTogglePublish?: (id: string, isPublished: boolean) => void;
  onDuplicate?: (product: ProductCardData) => void;
}

const monetizationLabels: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
  affiliate: { label: "Afiliado", variant: "default" },
  coupon: { label: "Cupom", variant: "secondary" },
  recommendation: { label: "Recomendação", variant: "outline" },
};

const statusLabels: Record<string, { label: string; className: string }> = {
  published: { label: "Publicado", className: "bg-green-500/10 text-green-600 border-green-200" },
  draft: { label: "Rascunho", className: "bg-yellow-500/10 text-yellow-600 border-yellow-200" },
  archived: { label: "Arquivado", className: "bg-gray-500/10 text-gray-600 border-gray-200" },
};

export function ProductCard({
  product,
  variant = "grid",
  showActions = false,
  showStats = true,
  onEdit,
  onDelete,
  onTogglePublish,
  onDuplicate,
}: ProductCardProps) {
  const formatPrice = (price: number, currency: string = "BRL") => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency,
    }).format(price);
  };

  const monetization = monetizationLabels[product.monetization_type || "affiliate"];
  const status = statusLabels[product.status || "published"];

  const handleCopyLink = () => {
    const url = `${window.location.origin}/p/${product.slug}`;
    navigator.clipboard.writeText(url);
    toast.success("Link copiado!");
  };

  if (variant === "compact") {
    return (
      <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
        <div className="h-12 w-12 rounded-md overflow-hidden bg-secondary flex-shrink-0">
          {product.image_url ? (
            <img src={product.image_url} alt={product.title} className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full flex items-center justify-center text-muted-foreground">
              <Eye className="h-5 w-5" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">{product.title}</p>
          {product.store && (
            <p className="text-xs text-muted-foreground truncate">{product.store}</p>
          )}
        </div>
        {product.price && (
          <p className="text-sm font-semibold">{formatPrice(product.price, product.currency || "BRL")}</p>
        )}
      </div>
    );
  }

  return (
    <div className={cn(
      "group relative rounded-xl border bg-card overflow-hidden transition-all hover:shadow-lg",
      variant === "list" && "flex gap-4"
    )}>
      {/* Image */}
      <Link
        to={`/p/${product.slug}`}
        className={cn(
          "block overflow-hidden bg-secondary",
          variant === "grid" ? "aspect-square" : "w-32 h-32 flex-shrink-0"
        )}
      >
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center text-muted-foreground">
            <svg className="h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
      </Link>

      {/* Badges overlay */}
      <div className="absolute top-2 left-2 flex flex-col gap-1">
        <Badge variant={monetization.variant} className="text-xs">
          {monetization.label}
        </Badge>
        {showActions && product.status !== "published" && (
          <Badge variant="outline" className={cn("text-xs", status.className)}>
            {status.label}
          </Badge>
        )}
      </div>

      {/* Actions dropdown */}
      {showActions && (
        <div className="absolute top-2 right-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit?.(product)}>
                <Pencil className="h-4 w-4 mr-2" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleCopyLink}>
                <Copy className="h-4 w-4 mr-2" />
                Copiar link
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <a href={product.affiliate_url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Ver na loja
                </a>
              </DropdownMenuItem>
              {onDuplicate && (
                <DropdownMenuItem onClick={() => onDuplicate(product)}>
                  <Files className="h-4 w-4 mr-2" />
                  Duplicar
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              {product.status === "published" ? (
                <DropdownMenuItem onClick={() => onTogglePublish?.(product.id, false)}>
                  Despublicar
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={() => onTogglePublish?.(product.id, true)}>
                  Publicar
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                onClick={() => onDelete?.(product.id)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Arquivar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      {/* Content */}
      <div className={cn("p-3 sm:p-4", variant === "list" && "flex-1")}>
        <Link to={`/p/${product.slug}`}>
          <h3 className="font-medium text-sm sm:text-base line-clamp-2 group-hover:text-primary transition-colors">
            {product.title}
          </h3>
        </Link>

        {product.store && (
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">{product.store}</p>
        )}

        {product.categories && product.categories.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {product.categories.slice(0, 3).map((category, index) => (
              <span key={index} className="text-xs px-2 py-0.5 bg-secondary rounded-full">
                {category}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between mt-3">
          {product.price ? (
            <p className="font-semibold">{formatPrice(product.price, product.currency || "BRL")}</p>
          ) : (
            <span />
          )}

          {showStats && (
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <MousePointerClick className="h-3.5 w-3.5" />
                {product.click_count || 0}
              </span>
              <span className="flex items-center gap-1">
                <Heart className="h-3.5 w-3.5" />
                {product.favorite_count || 0}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
