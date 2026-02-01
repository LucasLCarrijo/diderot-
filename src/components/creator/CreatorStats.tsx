import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface CreatorStatsProps {
  followerCount: number;
  productCount: number;
  postCount: number;
  className?: string;
}

export function CreatorStats({
  followerCount,
  productCount,
  postCount,
  className,
}: CreatorStatsProps) {
  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1).replace(/\.0$/, "") + "K";
    }
    return num.toString();
  };

  const stats = [
    {
      value: followerCount,
      label: "seguidores",
      tooltip: `${followerCount.toLocaleString()} pessoas seguem este creator`,
    },
    {
      value: productCount,
      label: "produtos",
      tooltip: `${productCount} produtos recomendados`,
    },
    {
      value: postCount,
      label: "posts",
      tooltip: `${postCount} posts no feed`,
    },
  ];

  return (
    <TooltipProvider>
      <div className={cn("flex items-center justify-center gap-6", className)}>
        {stats.map((stat, index) => (
          <div key={stat.label} className="flex items-center gap-6">
            {index > 0 && (
              <div className="h-8 w-px bg-border" aria-hidden="true" />
            )}
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="text-center cursor-default">
                  <p className="text-xl font-semibold">{formatNumber(stat.value)}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>{stat.tooltip}</p>
              </TooltipContent>
            </Tooltip>
          </div>
        ))}
      </div>
    </TooltipProvider>
  );
}
