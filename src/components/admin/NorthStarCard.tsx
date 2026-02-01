import { Target, TrendingUp, TrendingDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  LineChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from "recharts";

interface NorthStarCardProps {
  value: number;
  delta: number;
  goal: number;
  goalLabel: string;
  chartData: { date: string; value: number }[];
}

export function NorthStarCard({
  value,
  delta,
  goal,
  goalLabel,
  chartData,
}: NorthStarCardProps) {
  const isPositive = delta >= 0;
  const progress = Math.min((value / goal) * 100, 100);

  return (
    <Card className="border-admin-border bg-gradient-to-br from-admin-sidebar/5 to-transparent">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-primary/10">
            <Target className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">North Star Metric</p>
            <CardTitle className="text-base">Clicks por Creator Ativo (semanal)</CardTitle>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Value and Delta */}
          <div className="space-y-4">
            <div className="flex items-end gap-3">
              <span className="text-5xl font-bold tracking-tight">{value.toFixed(1)}</span>
              <div
                className={`flex items-center gap-1 px-2 py-1 rounded-full text-sm font-medium ${
                  isPositive
                    ? "bg-admin-success/10 text-admin-success"
                    : "bg-admin-danger/10 text-admin-danger"
                }`}
              >
                {isPositive ? (
                  <TrendingUp className="h-4 w-4" />
                ) : (
                  <TrendingDown className="h-4 w-4" />
                )}
                {isPositive ? "+" : ""}
                {delta.toFixed(1)}%
              </div>
            </div>

            {/* Goal Progress */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{goalLabel}</span>
                <span className="font-medium">{progress.toFixed(0)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {value.toFixed(1)} de {goal} clicks/creator
              </p>
            </div>
          </div>

          {/* Mini Chart */}
          <div className="h-[120px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--background))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                  formatter={(value: number) => [value.toFixed(1), "Clicks/Creator"]}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
