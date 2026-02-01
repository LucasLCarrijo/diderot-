import { useState } from "react";
import { subDays, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  MousePointer2, 
  TrendingUp, 
  Heart, 
  Download,
  Smartphone,
  Monitor,
  Tablet,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DateRangePicker, DateRange } from "@/components/analytics/DateRangePicker";
import { useCreatorAnalytics } from "@/hooks/useCreatorAnalytics";
import { CreatorLayout } from "@/components/layout/CreatorLayout";
import { useEntitlements } from "@/hooks/useEntitlements";
import { Paywall } from "@/components/subscription/Paywall";

const DEVICE_COLORS = {
  mobile: "hsl(var(--primary))",
  desktop: "hsl(var(--secondary))",
  tablet: "hsl(var(--accent))",
  unknown: "hsl(var(--muted))",
};

const DEVICE_ICONS = {
  mobile: Smartphone,
  desktop: Monitor,
  tablet: Tablet,
};

export default function Analytics() {
  const { hasCreatorPro, isLoading: isLoadingEntitlements } = useEntitlements();
  const [dateRange, setDateRange] = useState<DateRange>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });
  
  const {
    totalClicks,
    clicksOverTime,
    topProducts,
    deviceStats,
    utmStats,
    isLoading,
  } = useCreatorAnalytics(dateRange);
  
  const handleExportCSV = () => {
    const headers = ["Data", "Cliques"];
    const rows = clicksOverTime.map(d => [d.date, d.clicks.toString()]);
    const csvContent = [headers, ...rows].map(r => r.join(",")).join("\n");
    
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `analytics_${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };
  
  if (!isLoadingEntitlements && !hasCreatorPro) {
    return (
      <CreatorLayout title="Analytics" description="Acompanhe o desempenho dos seus produtos">
        <Paywall
          feature="Analytics Avançado"
          description="Faça upgrade para Creator Pro para acessar analytics completo, incluindo cliques, dispositivos e fontes de tráfego."
          className="min-h-[400px]"
        >
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[...Array(4)].map((_, i) => (
                <Card key={i}>
                  <CardHeader className="pb-2">
                    <Skeleton className="h-4 w-24" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-8 w-16" />
                  </CardContent>
                </Card>
              ))}
            </div>
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-48" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-[300px]" />
              </CardContent>
            </Card>
          </div>
        </Paywall>
      </CreatorLayout>
    );
  }
  return (
    <CreatorLayout title="Analytics" description="Acompanhe o desempenho dos seus produtos">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Analytics</h1>
            <p className="text-muted-foreground">
              Acompanhe o desempenho dos seus produtos
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <DateRangePicker value={dateRange} onChange={setDateRange} />
            <Button variant="outline" size="icon" onClick={handleExportCSV}>
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* Overview Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Cliques</CardTitle>
              <MousePointer2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-2xl font-bold">{totalClicks.toLocaleString()}</div>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Produtos</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-2xl font-bold">{topProducts.length}</div>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Favoritos</CardTitle>
              <Heart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-2xl font-bold">
                  {topProducts.reduce((sum, p) => sum + (p.favorite_count || 0), 0).toLocaleString()}
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Principal Fonte</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-2xl font-bold capitalize">
                  {utmStats[0]?.source || "Direto"}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Clicks Over Time Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Cliques ao Longo do Tempo</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[300px]" />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={clicksOverTime}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(date) => format(new Date(date), "dd/MM", { locale: ptBR })}
                    className="text-xs"
                  />
                  <YAxis className="text-xs" />
                  <Tooltip 
                    labelFormatter={(date) => format(new Date(date), "dd 'de' MMMM", { locale: ptBR })}
                    contentStyle={{ 
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "var(--radius)",
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="clicks" 
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={false}
                    name="Cliques"
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
        
        {/* Device and UTM Charts */}
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Dispositivos</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-[200px]" />
              ) : deviceStats.length > 0 ? (
                <div className="flex items-center gap-8">
                  <ResponsiveContainer width={150} height={150}>
                    <PieChart>
                      <Pie
                        data={deviceStats}
                        dataKey="count"
                        nameKey="device"
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={60}
                      >
                        {deviceStats.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={DEVICE_COLORS[entry.device as keyof typeof DEVICE_COLORS] || DEVICE_COLORS.unknown}
                          />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-2">
                    {deviceStats.map((stat) => {
                      const Icon = DEVICE_ICONS[stat.device as keyof typeof DEVICE_ICONS] || Monitor;
                      const total = deviceStats.reduce((sum, s) => sum + s.count, 0);
                      const percentage = ((stat.count / total) * 100).toFixed(1);
                      return (
                        <div key={stat.device} className="flex items-center gap-2">
                          <Icon className="h-4 w-4 text-muted-foreground" />
                          <span className="capitalize">{stat.device}</span>
                          <span className="text-muted-foreground">({percentage}%)</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  Nenhum dado disponível
                </p>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Fontes de Tráfego</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-[200px]" />
              ) : utmStats.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={utmStats.slice(0, 5)} layout="vertical">
                    <XAxis type="number" className="text-xs" />
                    <YAxis type="category" dataKey="source" className="text-xs capitalize" width={80} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "var(--radius)",
                      }}
                    />
                    <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} name="Cliques" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  Nenhum dado de UTM disponível
                </p>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Top Products Table */}
        <Card>
          <CardHeader>
            <CardTitle>Top 10 Produtos</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-12" />
                ))}
              </div>
            ) : topProducts.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produto</TableHead>
                    <TableHead className="text-right">Cliques</TableHead>
                    <TableHead className="text-right">Favoritos</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topProducts.map((product, index) => (
                    <TableRow key={product.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <span className="text-muted-foreground w-4">{index + 1}</span>
                          <Avatar className="h-10 w-10 rounded">
                            <AvatarImage src={product.image_url || ""} alt={product.title} />
                            <AvatarFallback className="rounded">{product.title[0]}</AvatarFallback>
                          </Avatar>
                          <span className="font-medium line-clamp-1">{product.title}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {(product.click_count || 0).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        {(product.favorite_count || 0).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-muted-foreground text-center py-8">
                Nenhum produto encontrado
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </CreatorLayout>
  );
}
