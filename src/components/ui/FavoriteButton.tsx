import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useIsFavorite, useToggleFavorite } from "@/hooks/useFavorites";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface FavoriteButtonProps {
  productId: string;
  size?: "sm" | "default";
  className?: string;
  showLabel?: boolean;
}

export function FavoriteButton({
  productId,
  size = "default",
  className,
  showLabel = true,
}: FavoriteButtonProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: isFavorite, isLoading } = useIsFavorite(productId);
  const toggleFavorite = useToggleFavorite();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      navigate("/auth/signin");
      return;
    }

    toggleFavorite.mutate({ productId, isFavorite: !!isFavorite });
  };

  const button = (
    <Button
      variant="ghost"
      size={size === "sm" ? "icon" : "default"}
      className={cn(
        "group/fav relative overflow-hidden",
        size === "sm" ? "h-8 w-8" : "h-9 px-3",
        toggleFavorite.isPending && "pointer-events-none",
        className
      )}
      onClick={handleClick}
      disabled={isLoading}
      aria-label={isFavorite ? "Remover da wishlist" : "Adicionar à wishlist"}
    >
      <Heart
        className={cn(
          "transition-all duration-300 ease-out",
          size === "sm" ? "h-4 w-4" : "h-5 w-5",
          isFavorite
            ? "fill-red-500 text-red-500 scale-110"
            : "text-muted-foreground group-hover/fav:text-red-500 group-hover/fav:scale-110",
          toggleFavorite.isPending && "animate-pulse"
        )}
        style={{
          filter: isFavorite ? "drop-shadow(0 0 8px rgba(239, 68, 68, 0.5))" : "none",
        }}
      />
      {showLabel && size !== "sm" && (
        <span className="ml-2">{isFavorite ? "Salvo" : "Salvar"}</span>
      )}
      
      {/* Ripple effect on favorite */}
      {isFavorite && (
        <span
          className="absolute inset-0 bg-red-500/20 rounded-full animate-ping pointer-events-none"
          style={{ animationDuration: "1s", animationIterationCount: "1" }}
        />
      )}
    </Button>
  );

  if (size === "sm") {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{button}</TooltipTrigger>
          <TooltipContent>
            <p>{isFavorite ? "Remover da wishlist" : "Adicionar à wishlist"}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return button;
}
