import { ShoppingBag, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTrackProductClick } from "@/hooks/useTrackProductClick";
import { UTMParams } from "@/lib/tracking";

interface GoToStoreButtonProps {
  affiliateUrl: string;
  productId: string;
  postId?: string;
  utmParams?: UTMParams;
  size?: "sm" | "default" | "lg";
  variant?: "default" | "outline" | "secondary";
  className?: string;
}

export function GoToStoreButton({
  affiliateUrl,
  productId,
  postId,
  utmParams,
  size = "default",
  variant = "default",
  className = "",
}: GoToStoreButtonProps) {
  const { trackAndRedirect } = useTrackProductClick();
  
  const handleClick = (e: React.MouseEvent) => {
    trackAndRedirect(affiliateUrl, productId, {
      postId,
      utmParams,
      event: e,
    });
  };
  
  return (
    <Button
      onClick={handleClick}
      size={size}
      variant={variant}
      className={`gap-2 ${className}`}
    >
      <ShoppingBag className="h-4 w-4" />
      Ir à Loja
      <ExternalLink className="h-3 w-3" />
    </Button>
  );
}
