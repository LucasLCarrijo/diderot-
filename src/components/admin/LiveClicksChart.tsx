import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { MousePointerClick } from "lucide-react";
import { cn } from "@/lib/utils";

interface LiveClicksChartProps {
  data: { time: string; value: number }[];
  currentValue: number;
  className?: string;
}

export function LiveClicksChart({ data, currentValue, className }: LiveClicksChartProps) {
  const [isUpdating, setIsUpdating] = useState(false);

  // Flash animation when data updates
  useEffect(() => {
    setIsUpdating(true);
    const timeout = setTimeout(() => setIsUpdating(false), 300);
    return () => clearTimeout(timeout);
  }, [data]);

  return (
    <Card className={cn("border-admin-border overflow-hidden", className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <MousePointerClick className="h-4 w-4" />
            Clicks em Tempo Real
          </CardTitle>
          <Badge
            variant="outline"
            className={cn(
              "transition-all duration-300",
              isUpdating && "bg-primary/10 text-primary border-primary/50"
            )}
          >
            {currentValue}/min
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="h-[120px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="clickGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="time"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
              />
              <YAxis hide domain={["dataMin - 5", "dataMax + 5"]} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
                labelStyle={{ color: "hsl(var(--foreground))" }}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                fill="url(#clickGradient)"
                animationDuration={300}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
