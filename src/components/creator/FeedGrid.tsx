import { FeedPostCard } from "./FeedPostCard";

interface Post {
  id: string;
  title?: string | null;
  image_url: string;
  created_at: string;
  product_count?: number;
}

interface FeedGridProps {
  posts: Post[];
}

export function FeedGrid({ posts }: FeedGridProps) {
  if (posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <svg className="h-16 w-16 text-muted-foreground/50 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <h3 className="text-lg font-sans font-medium mb-1">Nenhum post ainda</h3>
        <p className="text-muted-foreground text-sm">Este creator ainda não compartilhou posts no feed.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {posts.map((post) => (
        <FeedPostCard key={post.id} post={post} />
      ))}
    </div>
  );
}
