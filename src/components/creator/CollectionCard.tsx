import { Link } from "react-router-dom";
import { FolderOpen } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface CollectionCardProps {
  collection: {
    id: string;
    name: string;
    thumbnail_url?: string | null;
    updated_at: string;
    product_count?: number;
  };
}

export function CollectionCard({ collection }: CollectionCardProps) {
  return (
    <Link
      to={`/c/${collection.id}`}
      className="group text-left w-full product-card block"
    >
      <div className="aspect-[4/3] overflow-hidden bg-secondary rounded-t-xl">
        {collection.thumbnail_url ? (
          <img
            src={collection.thumbnail_url}
            alt={collection.name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center text-muted-foreground bg-gradient-to-br from-secondary to-muted">
            <FolderOpen className="h-12 w-12" />
          </div>
        )}
      </div>

      <div className="p-3 space-y-1">
        <h3 className="font-medium text-sm group-hover:underline">
          {collection.name}
        </h3>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{collection.product_count || 0} produtos</span>
          <span>
            {formatDistanceToNow(new Date(collection.updated_at), {
              addSuffix: true,
              locale: ptBR,
            })}
          </span>
        </div>
      </div>
    </Link>
  );
}
