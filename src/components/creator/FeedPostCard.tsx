import { Link } from "react-router-dom";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface FeedPostCardProps {
  post: {
    id: string;
    title?: string | null;
    image_url: string;
    created_at: string;
    product_count?: number;
  };
}

export function FeedPostCard({ post }: FeedPostCardProps) {
  return (
    <Link
      to={`/posts/${post.id}`}
      className="group text-left w-full product-card block"
    >
      <div className="aspect-square overflow-hidden bg-secondary rounded-t-xl">
        <img
          src={post.image_url}
          alt={post.title || "Post"}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
      </div>

      <div className="p-3 space-y-1">
        {post.title && (
          <h3 className="font-medium text-sm line-clamp-2 group-hover:underline">
            {post.title}
          </h3>
        )}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {format(new Date(post.created_at), "d 'de' MMM, yyyy", { locale: ptBR })}
          </span>
          {post.product_count && post.product_count > 0 && (
            <span className="flex items-center gap-1">
              <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
              </svg>
              {post.product_count}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
