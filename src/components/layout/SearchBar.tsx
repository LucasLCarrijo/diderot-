import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useSearch } from "@/hooks/useSearch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function SearchBar() {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const { data: results, isLoading } = useSearch(query);

  const handleClose = () => {
    setQuery("");
    setIsOpen(false);
  };

  const formatPrice = (price: number | null, currency: string | null) => {
    if (!price) return null;
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: currency || "BRL",
    }).format(price);
  };

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar produtos ou creators..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => query && setIsOpen(true)}
          className="w-64 pl-9 pr-8"
        />
        {query && (
          <button
            onClick={handleClose}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-secondary rounded"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        )}
      </div>

      {isOpen && query.length >= 2 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-background border border-border rounded-lg shadow-lg z-50 overflow-hidden">
          {isLoading ? (
            <div className="p-4 text-center text-muted-foreground">
              Buscando...
            </div>
          ) : results && (results.products.length > 0 || results.creators.length > 0) ? (
            <div className="max-h-96 overflow-y-auto">
              {results.creators.length > 0 && (
                <div>
                  <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase bg-secondary/50">
                    Creators
                  </div>
                  {results.creators.map((creator) => (
                    <Link
                      key={creator.id}
                      to={`/${creator.username}`}
                      onClick={handleClose}
                      className="flex items-center gap-3 px-3 py-2 hover:bg-secondary transition-colors"
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={creator.avatar_url || undefined} />
                        <AvatarFallback>
                          {creator.name?.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">{creator.name}</p>
                        <p className="text-xs text-muted-foreground">
                          @{creator.username}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}

              {results.products.length > 0 && (
                <div>
                  <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase bg-secondary/50">
                    Produtos
                  </div>
                  {results.products.map((product) => {
                    const productUrl = product.slug ? `/p/${product.slug}` : null;
                    return (
                      <Link
                        key={product.id}
                        to={productUrl || `/${product.creator?.username}`}
                        onClick={handleClose}
                        className="flex items-center gap-3 px-3 py-2 hover:bg-secondary transition-colors"
                      >
                        <div className="w-10 h-10 rounded bg-secondary flex-shrink-0 overflow-hidden">
                          {product.image_url ? (
                            <img
                              src={product.image_url}
                              alt={product.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                              IMG
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-sm truncate">
                            {product.title}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            por @{product.creator?.username}
                            {product.price && (
                              <span className="ml-2 font-medium">
                                {formatPrice(product.price, product.currency)}
                              </span>
                            )}
                          </p>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <div className="p-4 text-center text-muted-foreground">
              Nenhum resultado encontrado
            </div>
          )}
        </div>
      )}
    </div>
  );
}
