import { useState, useEffect } from "react";
import { useRealtime } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { PeriodSelector, Period } from "@/components/admin/PeriodSelector";
import { NorthStarCard } from "@/components/admin/NorthStarCard";
import { KPICard, MetricValue, MetricBreakdown } from "@/components/admin/KPICard";
import { ActivityFeed } from "@/components/admin/ActivityFeed";
import { AnimatedCounter } from "@/components/admin/AnimatedCounter";
import { LiveClicksChart } from "@/components/admin/LiveClicksChart";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  BarChart,
  Bar,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
  Tooltip as RechartsTooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Users,
  DollarSign,
  UserPlus,
  Activity,
  TrendingUp,
  MousePointerClick,
  Heart,
  UserCheck,
  Package,
  FileImage,
  Target,
  Info,
  Zap,
  Eye,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import {
  useUserMetrics,
  useContentMetrics,
  useEngagementMetrics,
  useSubscriptionMetrics,
  useModerationMetrics,
  useTopProducts,
  useTopCreators,
  useDailyMetrics,
  useNorthStarMetric,
  useRecentActivity,
} from "@/hooks/useAdminMetrics";
import { format } from "date-fns";

const CATEGORY_COLORS = [
  "hsl(var(--primary))",
  "hsl(262 83% 58%)",
  "hsl(142 76% 36%)",
  "hsl(25 95% 53%)",
  "hsl(200 98% 39%)",
];

// Loading skeleton for cards
function CardSkeleton() {
  return (
    <Card className="border-admin-border">
      <CardContent className="p-5">
        <div className="space-y-3">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-20 w-full" />
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminOverview() {
  const [period, setPeriod] = useState<Period>("30d");
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined,
  });
  const [compareWithPrevious, setCompareWithPrevious] = useState(false);

  // Fetch real data using hooks - all hooks now respect period filters
  const { data: userMetrics, isLoading: loadingUsers } = useUserMetrics(period, dateRange);
  const { data: contentMetrics, isLoading: loadingContent } = useContentMetrics(period, dateRange);
  const { data: engagementMetrics, isLoading: loadingEngagement } = useEngagementMetrics(period, dateRange);
  const { data: subscriptionMetrics, isLoading: loadingSubscriptions } = useSubscriptionMetrics(period, dateRange);
  const { data: moderationMetrics, isLoading: loadingModeration } = useModerationMetrics(period, dateRange);
  const { data: topProducts, isLoading: loadingTopProducts } = useTopProducts(5);
  const { data: topCreators, isLoading: loadingTopCreators } = useTopCreators(5);
  const { data: dailyMetrics, isLoading: loadingDaily } = useDailyMetrics(period, dateRange);
  const { data: northStarData, isLoading: loadingNorthStar } = useNorthStarMetric(period, dateRange);
  const { data: recentActivity, isLoading: loadingActivity } = useRecentActivity(10);

  // Get real-time data from context
  const realtime = useRealtime();
  
  // Show toast for new Pro conversions
  useEffect(() => {
    if (realtime.metrics.liveConversions > 0) {
      const lastEvent = realtime.events.find(e => e.type === "conversion");
      if (lastEvent && lastEvent.isNew) {
        toast.success("Nova assinatura Pro!", {
          description: lastEvent.message,
          duration: 5000,
        });
      }
    }
  }, [realtime.metrics.liveConversions, realtime.events]);

  // Compute delta percentages
  const calculateDelta = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  // Users by role data for pie chart
  const usersByRoleData = userMetrics ? [
    { name: "Followers", value: userMetrics.totalFollowers, color: "hsl(var(--primary))" },
    { name: "Creators", value: userMetrics.totalCreators, color: "hsl(142 76% 36%)" },
    { name: "Brands", value: userMetrics.totalBrands, color: "hsl(25 95% 53%)" },
  ] : [];

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <PeriodSelector
        period={period}
        onPeriodChange={setPeriod}
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        compareWithPrevious={compareWithPrevious}
        onCompareChange={setCompareWithPrevious}
      />

      {/* Real-Time Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Users Online */}
        <Card className="border-admin-border bg-gradient-to-br from-green-500/10 to-transparent">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Eye className="h-5 w-5 text-green-500" />
                  <span className="absolute -top-0.5 -right-0.5 h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                </div>
                <span className="text-sm font-medium text-muted-foreground">Usuários Online</span>
              </div>
              <Badge variant="outline" className="bg-green-500/10 text-green-600 border-0 text-xs">
                Agora
              </Badge>
            </div>
            <div className="mt-2">
              <AnimatedCounter 
                value={realtime.metrics.usersOnline} 
                className="text-3xl font-bold"
                showDelta
              />
            </div>
          </CardContent>
        </Card>

        {/* Live Clicks Chart */}
        <div className="md:col-span-2">
          <LiveClicksChart 
            data={realtime.clicksChartData}
            currentValue={realtime.metrics.clicksPerMinute}
          />
        </div>

        {/* Live Conversions */}
        <Card className="border-admin-border bg-gradient-to-br from-purple-500/10 to-transparent">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-purple-500" />
                <span className="text-sm font-medium text-muted-foreground">Conversões Pro</span>
              </div>
              <Badge variant="outline" className="bg-purple-500/10 text-purple-600 border-0 text-xs">
                Hoje
              </Badge>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <AnimatedCounter 
                value={realtime.metrics.liveConversions} 
                className="text-3xl font-bold"
                showDelta
              />
              <span className="text-sm text-muted-foreground">novas</span>
            </div>
            {realtime.metrics.liveConversions > 0 && (
              <p className="text-xs text-green-500 mt-1">
                +R$ {(realtime.metrics.liveConversions * 49.9).toFixed(2)} MRR
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* North Star Metric */}
      {loadingNorthStar ? (
        <Card className="border-admin-border">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-8 w-24" />
              </div>
            </div>
            <Skeleton className="h-[200px] w-full mt-4" />
          </CardContent>
        </Card>
      ) : northStarData && (
        <NorthStarCard
          value={northStarData.value}
          delta={northStarData.delta}
          goal={northStarData.goal}
          goalLabel="Meta Q1: 50 clicks/creator"
          chartData={northStarData.chartData}
        />
      )}

      {/* KPIs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* DAU/WAU/MAU */}
        {loadingUsers ? <CardSkeleton /> : (
          <KPICard
            title="Usuários Ativos"
            icon={Activity}
            tooltip="Usuários que interagiram com a plataforma recentemente"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Hoje</span>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold">{userMetrics?.newUsersToday || 0}</span>
                  <span className="text-xs text-green-500">novos</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Esta semana</span>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold">{userMetrics?.newUsersThisWeek || 0}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Este mês</span>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold">{userMetrics?.newUsersThisMonth || 0}</span>
                </div>
              </div>
            </div>
          </KPICard>
        )}

        {/* Total Users */}
        {loadingUsers ? <CardSkeleton /> : (
          <KPICard
            title="Total de Usuários"
            icon={Users}
            tooltip="Total de usuários registrados na plataforma"
          >
            <MetricValue value={(userMetrics?.totalUsers || 0).toLocaleString()} />
            <MetricBreakdown items={[
              { label: "Followers", value: (userMetrics?.totalFollowers || 0).toLocaleString() },
              { label: "Creators", value: (userMetrics?.totalCreators || 0).toLocaleString() },
              { label: "Brands", value: (userMetrics?.totalBrands || 0).toLocaleString() },
            ]} />
          </KPICard>
        )}

        {/* MRR */}
        {loadingSubscriptions ? <CardSkeleton /> : (
          <KPICard
            title="MRR"
            icon={DollarSign}
            tooltip="Monthly Recurring Revenue - receita recorrente mensal das assinaturas"
          >
            <MetricValue
              value={`R$ ${((subscriptionMetrics?.mrr || 0) / 1000).toFixed(1)}K`}
            />
            <div className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Assinaturas Ativas</span>
                <span className="font-medium">{subscriptionMetrics?.activeSubscriptions || 0}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">ARR Projetado</span>
                <span className="font-medium">R$ {((subscriptionMetrics?.totalRevenue || 0) / 1000).toFixed(0)}K</span>
              </div>
            </div>
          </KPICard>
        )}

        {/* Pro Conversion */}
        {loadingSubscriptions ? <CardSkeleton /> : (
          <KPICard
            title="Conversão Pro"
            icon={TrendingUp}
            tooltip="Taxa de conversão de Creators Free para Creator Pro"
          >
            <MetricValue 
              value={`${subscriptionMetrics?.activeSubscriptions || 0}`} 
            />
            <div className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Novos este mês</span>
                <span className="font-medium text-green-500">+{subscriptionMetrics?.newSubscriptionsThisMonth || 0}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Cancelados</span>
                <span className="font-medium text-red-500">{subscriptionMetrics?.canceledThisMonth || 0}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Churn Rate</span>
                <span className="font-medium">{(subscriptionMetrics?.churnRate || 0).toFixed(1)}%</span>
              </div>
            </div>
          </KPICard>
        )}
      </div>

      {/* Section 3 - Content & Creators Metrics */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-lg font-semibold">Métricas de Conteúdo</h2>
          <Tooltip>
            <TooltipTrigger>
              <Info className="h-4 w-4 text-muted-foreground" />
            </TooltipTrigger>
            <TooltipContent>
              <p className="max-w-xs text-xs">Métricas de atividade e produtividade dos creators na plataforma</p>
            </TooltipContent>
          </Tooltip>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Active Creators */}
          {loadingUsers ? <CardSkeleton /> : (
            <Card className="border-admin-border">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-admin-accent">
                      <UserCheck className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <span className="text-sm font-medium text-muted-foreground">Creators Ativos</span>
                  </div>
                </div>
                <MetricValue value={(userMetrics?.totalCreators || 0).toLocaleString()} />
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Com produtos</span>
                    <span className="font-medium">{userMetrics?.totalCreators || 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Products Created */}
          {loadingContent ? <CardSkeleton /> : (
            <Card className="border-admin-border">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-2 rounded-lg bg-admin-accent">
                    <Package className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <span className="text-sm font-medium text-muted-foreground">Produtos</span>
                </div>
                <MetricValue value={(contentMetrics?.totalProducts || 0).toLocaleString()} />
                <div className="space-y-2 mt-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Esta semana</span>
                    <span className="font-medium text-green-500">+{contentMetrics?.productsThisWeek || 0}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Publicados</span>
                    <span className="font-medium">{contentMetrics?.publishedProducts || 0}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Rascunhos</span>
                    <span className="font-medium text-muted-foreground">{contentMetrics?.draftProducts || 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Posts Created */}
          {loadingContent ? <CardSkeleton /> : (
            <Card className="border-admin-border">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-2 rounded-lg bg-admin-accent">
                    <FileImage className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <span className="text-sm font-medium text-muted-foreground">Posts</span>
                </div>
                <MetricValue value={(contentMetrics?.totalPosts || 0).toLocaleString()} />
                <div className="space-y-2 mt-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Esta semana</span>
                    <span className="font-medium text-green-500">+{contentMetrics?.postsThisWeek || 0}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Coleções</span>
                    <span className="font-medium">{contentMetrics?.totalCollections || 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Section 4 - Engagement Metrics */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-lg font-semibold">Métricas de Engajamento</h2>
          <Tooltip>
            <TooltipTrigger>
              <Info className="h-4 w-4 text-muted-foreground" />
            </TooltipTrigger>
            <TooltipContent>
              <p className="max-w-xs text-xs">Indicadores de interação entre usuários e conteúdo da plataforma</p>
            </TooltipContent>
          </Tooltip>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Total Clicks */}
          {loadingEngagement ? <CardSkeleton /> : (
            <Card className="border-admin-border">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-2 rounded-lg bg-admin-accent">
                    <MousePointerClick className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <span className="text-sm font-medium text-muted-foreground">Clicks Totais</span>
                </div>
                <MetricValue value={(engagementMetrics?.totalClicks || 0).toLocaleString()} />
                <div className="space-y-2 mt-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Hoje</span>
                    <span className="font-medium text-green-500">+{engagementMetrics?.clicksToday || 0}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Esta semana</span>
                    <span className="font-medium">{engagementMetrics?.clicksThisWeek || 0}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Média por produto</span>
                    <span className="font-medium">{(engagementMetrics?.avgClicksPerProduct || 0).toFixed(1)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Favorites Added */}
          {loadingEngagement ? <CardSkeleton /> : (
            <Card className="border-admin-border">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-2 rounded-lg bg-admin-accent">
                    <Heart className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <span className="text-sm font-medium text-muted-foreground">Favoritos</span>
                </div>
                <MetricValue value={(engagementMetrics?.totalFavorites || 0).toLocaleString()} />
                <div className="space-y-2 mt-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Hoje</span>
                    <span className="font-medium text-green-500">+{engagementMetrics?.favoritesToday || 0}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Média por produto</span>
                    <span className="font-medium">{(engagementMetrics?.avgFavoritesPerProduct || 0).toFixed(1)}</span>
                  </div>
                </div>
                {topProducts && topProducts.length > 0 && (
                  <div className="mt-3 pt-3 border-t">
                    <p className="text-xs text-muted-foreground mb-2">Top produtos</p>
                    <div className="space-y-1.5">
                      {topProducts.slice(0, 3).map((product, idx) => (
                        <div key={idx} className="flex items-center justify-between text-xs">
                          <span className="truncate max-w-[140px]">{product.title}</span>
                          <span className="text-muted-foreground">{product.favorites} ❤️</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Creator Follows */}
          {loadingEngagement ? <CardSkeleton /> : (
            <Card className="border-admin-border">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-2 rounded-lg bg-admin-accent">
                    <UserPlus className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <span className="text-sm font-medium text-muted-foreground">Follows</span>
                </div>
                <MetricValue value={(engagementMetrics?.totalFollows || 0).toLocaleString()} />
                <div className="space-y-2 mt-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Hoje</span>
                    <span className="font-medium text-green-500">+{engagementMetrics?.followsToday || 0}</span>
                  </div>
                </div>
                {topCreators && topCreators.length > 0 && (
                  <div className="mt-3 pt-3 border-t">
                    <p className="text-xs text-muted-foreground mb-2">Top creators</p>
                    <div className="space-y-1.5">
                      {topCreators.slice(0, 3).map((creator, idx) => (
                        <div key={idx} className="flex items-center justify-between text-xs">
                          <span className="truncate max-w-[140px]">@{creator.username}</span>
                          <span className="text-muted-foreground">{creator.followers} 👥</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Section 5 - Charts & Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Metrics Chart */}
        <Card className="border-admin-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Atividade Diária</CardTitle>
            <CardDescription>Clicks, favoritos e cadastros nos últimos {period === "7d" ? "7" : period === "30d" ? "30" : period === "90d" ? "90" : "365"} dias</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingDaily ? (
              <Skeleton className="h-[300px] w-full" />
            ) : dailyMetrics && dailyMetrics.length > 0 ? (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dailyMetrics}>
                    <defs>
                      <linearGradient id="clicksGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="favoritesGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(340 82% 52%)" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="hsl(340 82% 52%)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(value) => {
                        const date = new Date(value);
                        return format(date, "dd/MM");
                      }}
                    />
                    <YAxis 
                      tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <RechartsTooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                        fontSize: "12px",
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }} />
                    <Area
                      type="monotone"
                      dataKey="clicks"
                      name="Clicks"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      fill="url(#clicksGradient)"
                    />
                    <Area
                      type="monotone"
                      dataKey="favorites"
                      name="Favoritos"
                      stroke="hsl(340 82% 52%)"
                      strokeWidth={2}
                      fill="url(#favoritesGradient)"
                    />
                    <Line
                      type="monotone"
                      dataKey="signups"
                      name="Cadastros"
                      stroke="hsl(142 76% 36%)"
                      strokeWidth={2}
                      dot={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Nenhum dado disponível para o período</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Users by Role Pie Chart */}
        <Card className="border-admin-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Distribuição de Usuários</CardTitle>
            <CardDescription>Por tipo de conta</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingUsers ? (
              <Skeleton className="h-[300px] w-full" />
            ) : usersByRoleData.length > 0 && usersByRoleData.some(d => d.value > 0) ? (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={usersByRoleData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                      labelLine={false}
                    >
                      {usersByRoleData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                        fontSize: "12px",
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: "12px" }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Nenhum usuário registrado ainda</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Moderation & Activity Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pending Items */}
        <Card className="border-admin-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Itens Pendentes</CardTitle>
            <CardDescription>Ações que requerem atenção</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingModeration ? (
              <div className="space-y-3">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-admin-accent">
                  <span className="text-sm">Reports pendentes</span>
                  <Badge variant={moderationMetrics?.pendingReports ? "destructive" : "secondary"}>
                    {moderationMetrics?.pendingReports || 0}
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-admin-accent">
                  <span className="text-sm">Resolvidos hoje</span>
                  <Badge variant="outline" className="bg-green-500/10 text-green-600 border-0">
                    {moderationMetrics?.resolvedReportsToday || 0}
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-admin-accent">
                  <span className="text-sm">Total de reports</span>
                  <Badge variant="secondary">
                    {moderationMetrics?.totalReports || 0}
                  </Badge>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Activity Feed - Real-time events */}
        <div className="lg:col-span-2">
          <ActivityFeed
            events={realtime.events}
            isPaused={realtime.isPaused}
            onTogglePause={realtime.togglePause}
            onClear={realtime.clearEvents}
          />
        </div>
      </div>
    </div>
  );
}
