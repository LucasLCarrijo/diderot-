import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { Star, GripVertical, X } from "lucide-react";
import { toast } from "sonner";

interface FavoriteItem {
  id: string;
  name: string;
  href: string;
}

const STORAGE_KEY = "admin-favorites";

// Load favorites from localStorage
const loadFavorites = (): FavoriteItem[] => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
};

// Save favorites to localStorage
const saveFavorites = (favorites: FavoriteItem[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
};

// Hook to use favorites
export function useAdminFavorites() {
  const [favorites, setFavorites] = useState<FavoriteItem[]>(loadFavorites);
  const location = useLocation();

  useEffect(() => {
    saveFavorites(favorites);
  }, [favorites]);

  const isFavorite = (href: string) => favorites.some((f) => f.href === href);

  const toggleFavorite = (name: string, href: string) => {
    if (isFavorite(href)) {
      setFavorites((prev) => prev.filter((f) => f.href !== href));
      toast.success("Removido dos favoritos");
    } else {
      const newFavorite: FavoriteItem = {
        id: Date.now().toString(),
        name,
        href,
      };
      setFavorites((prev) => [...prev, newFavorite]);
      toast.success("Adicionado aos favoritos");
    }
  };

  const removeFavorite = (id: string) => {
    setFavorites((prev) => prev.filter((f) => f.id !== id));
  };

  const reorderFavorites = (startIndex: number, endIndex: number) => {
    const result = Array.from(favorites);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);
    setFavorites(result);
  };

  return {
    favorites,
    isFavorite,
    toggleFavorite,
    removeFavorite,
    reorderFavorites,
  };
}

// Star button for header
interface FavoriteStarProps {
  pageName: string;
  pageHref: string;
}

export function FavoriteStar({ pageName, pageHref }: FavoriteStarProps) {
  const { isFavorite, toggleFavorite } = useAdminFavorites();
  const favorited = isFavorite(pageHref);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => toggleFavorite(pageName, pageHref)}
        >
          <Star
            className={cn(
              "h-4 w-4 transition-colors",
              favorited
                ? "fill-yellow-400 text-yellow-400"
                : "text-muted-foreground hover:text-yellow-400"
            )}
          />
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        {favorited ? "Remover dos favoritos" : "Adicionar aos favoritos"}
      </TooltipContent>
    </Tooltip>
  );
}

// Favorites list for sidebar
export function FavoritesList() {
  const { favorites, removeFavorite } = useAdminFavorites();
  const location = useLocation();

  if (favorites.length === 0) {
    return null;
  }

  return (
    <div className="px-3 py-2">
      <div className="flex items-center gap-2 px-2 mb-2">
        <Star className="h-3.5 w-3.5 text-yellow-400 fill-yellow-400" />
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Favoritos
        </span>
      </div>
      <div className="space-y-0.5">
        {favorites.map((favorite) => {
          const isActive = location.pathname === favorite.href;
          
          return (
            <div
              key={favorite.id}
              className="group flex items-center gap-1"
            >
              <Link
                to={favorite.href}
                className={cn(
                  "flex-1 flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors",
                  isActive
                    ? "bg-admin-accent text-admin-accent-foreground"
                    : "text-admin-muted hover:bg-admin-accent/50 hover:text-admin-foreground"
                )}
              >
                <GripVertical className="h-3 w-3 opacity-0 group-hover:opacity-50 cursor-grab" />
                <span className="truncate">{favorite.name}</span>
              </Link>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => removeFavorite(favorite.id)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
