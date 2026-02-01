import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface MiniClicksChartProps {
  productId: string;
  className?: string;
}

interface DayData {
  date: string;
  clicks: number;
}

export function MiniClicksChart({ productId, className }: MiniClicksChartProps) {
  // Fetch clicks for last 7 days
  const { data: clicksData } = useQuery({
    queryKey: ["product-clicks-chart", productId],
    queryFn: async () => {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data, error } = await supabase
        .from("clicks")
        .select("created_at")
        .eq("product_id", productId)
        .gte("created_at", sevenDaysAgo.toISOString());

      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Process data into daily buckets
  const chartData = useMemo(() => {
    const days: DayData[] = [];
    const today = new Date();

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];

      const clicks = (clicksData || []).filter((c) =>
        c.created_at.startsWith(dateStr)
      ).length;

      days.push({ date: dateStr, clicks });
    }

    return days;
  }, [clicksData]);

  const maxClicks = Math.max(...chartData.map((d) => d.clicks), 1);
  const totalClicks = chartData.reduce((sum, d) => sum + d.clicks, 0);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + "T12:00:00");
    return date.toLocaleDateString("pt-BR", { weekday: "short", day: "numeric" });
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={`flex items-end gap-0.5 h-6 ${className}`}>
            {chartData.map((day, index) => (
              <div
                key={day.date}
                className="flex-1 bg-primary/20 rounded-sm min-w-[3px] transition-all hover:bg-primary/40"
                style={{
                  height: `${Math.max((day.clicks / maxClicks) * 100, 8)}%`,
                }}
              />
            ))}
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="p-3">
          <p className="font-medium mb-2">Últimos 7 dias: {totalClicks} cliques</p>
          <div className="space-y-1 text-xs">
            {chartData.map((day) => (
              <div key={day.date} className="flex justify-between gap-4">
                <span className="text-muted-foreground">{formatDate(day.date)}</span>
                <span className="font-medium">{day.clicks}</span>
              </div>
            ))}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
