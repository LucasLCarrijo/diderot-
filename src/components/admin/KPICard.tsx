import { ReactNode } from "react";
import { TrendingUp, TrendingDown, Info } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  AreaChart,
  Area,
  ResponsiveContainer,
} from "recharts";
import { LucideIcon } from "lucide-react";

interface KPICardProps {
  title: string;
  icon: LucideIcon;
  tooltip?: string;
  children: ReactNode;
  sparklineData?: number[];
  sparklineColor?: string;
}

export function KPICard({
  title,
  icon: Icon,
  tooltip,
  children,
  sparklineData,
  sparklineColor = "hsl(var(--primary))",
}: KPICardProps) {
  const chartData = sparklineData?.map((value, index) => ({ value, index }));

  return (
    <Card className="border-admin-border">
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-admin-accent">
              <Icon className="h-4 w-4 text-muted-foreground" />
            </div>
            <span className="text-sm font-medium text-muted-foreground">{title}</span>
            {tooltip && (
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-3.5 w-3.5 text-muted-foreground/50" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs text-xs">{tooltip}</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>

        <div className="space-y-3">
          {children}
        </div>

        {sparklineData && sparklineData.length > 0 && (
          <div className="h-[40px] mt-3 -mx-1">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id={`gradient-${title}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={sparklineColor} stopOpacity={0.3} />
                    <stop offset="100%" stopColor={sparklineColor} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke={sparklineColor}
                  strokeWidth={1.5}
                  fill={`url(#gradient-${title})`}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface MetricValueProps {
  value: string | number;
  delta?: number;
  deltaLabel?: string;
  size?: "lg" | "md" | "sm";
}

export function MetricValue({ value, delta, deltaLabel, size = "lg" }: MetricValueProps) {
  const isPositive = delta !== undefined && delta >= 0;
  const sizeClasses = {
    lg: "text-3xl",
    md: "text-2xl",
    sm: "text-xl",
  };

  return (
    <div className="flex items-end gap-2">
      <span className={`font-bold tracking-tight ${sizeClasses[size]}`}>{value}</span>
      {delta !== undefined && (
        <div
          className={`flex items-center gap-0.5 text-xs font-medium ${
            isPositive ? "text-admin-success" : "text-admin-danger"
          }`}
        >
          {isPositive ? (
            <TrendingUp className="h-3 w-3" />
          ) : (
            <TrendingDown className="h-3 w-3" />
          )}
          {isPositive ? "+" : ""}
          {delta.toFixed(1)}%
          {deltaLabel && <span className="text-muted-foreground ml-1">{deltaLabel}</span>}
        </div>
      )}
    </div>
  );
}

interface MetricBreakdownProps {
  items: { label: string; value: string | number; delta?: number }[];
}

export function MetricBreakdown({ items }: MetricBreakdownProps) {
  return (
    <div className="space-y-1.5">
      {items.map((item, idx) => {
        const isPositive = item.delta !== undefined && item.delta >= 0;
        return (
          <div key={idx} className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{item.label}</span>
            <div className="flex items-center gap-2">
              <span className="font-medium">{item.value}</span>
              {item.delta !== undefined && (
                <span
                  className={`text-xs ${
                    isPositive ? "text-admin-success" : "text-admin-danger"
                  }`}
                >
                  {isPositive ? "+" : ""}
                  {item.delta.toFixed(1)}%
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
