import { Skeleton } from "@/components/ui/skeleton";

interface FeedSkeletonProps {
  count?: number;
}

export function FeedSkeleton({ count = 8 }: FeedSkeletonProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-card rounded-lg overflow-hidden border border-border/50"
        >
          <Skeleton className="aspect-square w-full" />
          <div className="p-3 space-y-2">
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-5 rounded-full" />
              <Skeleton className="h-3 w-20" />
            </div>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-4 w-16" />
          </div>
        </div>
      ))}
    </div>
  );
}
