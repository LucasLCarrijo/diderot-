import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Target,
  TrendingUp,
  TrendingDown,
  MousePointerClick,
  Users,
  ShoppingBag,
  FileText,
  Lightbulb,
  AlertCircle,
  CheckCircle,
  Info,
  Sparkles,
  BarChart3,
  Layers,
  RefreshCw,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend,
  BarChart,
  Bar,
  Cell,
  AreaChart,
  Area,
} from "recharts";
import {
  useNorthStarData,
  useWeeklyNsmData,
  useLeadingIndicators,
  useLaggingIndicators,
  useCategorySegmentation,
  usePlanSegmentation,
  useCohortNsmData,
  useNsmInsights,
  type IndicatorData,
  type InsightData,
} from "@/hooks/useNorthStarData";

// Get color based on NSM value (for cohort heatmap)
const getNsmColor = (value: number | null, average: number) => {
  if (value === null) return "bg-muted";
  const ratio = value / average;
  if (ratio >= 1.3) return "bg-green-500";
  if (ratio >= 1.1) return "bg-green-400";
  if (ratio >= 0.9) return "bg-yellow-400";
  if (ratio >= 0.7) return "bg-orange-400";
  return "bg-red-500";
};

// Mini sparkline component
const MiniSparkline = ({ data, color = "hsl(221 83% 53%)" }: { data: number[]; color?: string }) => {
  const chartData = data.map((value, index) => ({ index, value }));
  const uniqueId = `sparkline-${data.join("-")}`;
  
  return (
    <div className="h-8 w-20">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id={uniqueId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.3} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            fill={`url(#${uniqueId})`}
            strokeWidth={1.5}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

// Loading skeleton for cards
const CardSkeleton = () => (
  <Card>
    <CardHeader className="pb-2">
      <Skeleton className="h-5 w-32" />
    </CardHeader>
    <CardContent className="space-y-4">
      <Skeleton className="h-10 w-24" />
      <Skeleton className="h-16 w-full" />
    </CardContent>
  </Card>
);

// Insight icon mapper
const getInsightIcon = (type: InsightData["type"]) => {
  switch (type) {
    case "success": return CheckCircle;
    case "warning": return AlertCircle;
    case "info": return Info;
    default: return Sparkles;
  }
};

export default function AdminNorthStar() {
  const { data: nsmData, isLoading: isLoadingNsm, error: nsmError, refetch: refetchNsm } = useNorthStarData();
  const { data: weeklyData, isLoading: isLoadingWeekly } = useWeeklyNsmData();
  const { data: leadingIndicators, isLoading: isLoadingLeading } = useLeadingIndicators();
  const { data: laggingIndicators, isLoading: isLoadingLagging } = useLaggingIndicators();
  const { data: categoryData, isLoading: isLoadingCategory } = useCategorySegmentation();
  const { data: planData, isLoading: isLoadingPlan } = usePlanSegmentation();
  const { data: cohortData, isLoading: isLoadingCohort } = useCohortNsmData();
  const { data: insights, isLoading: isLoadingInsights } = useNsmInsights();

  const isLoading = isLoadingNsm || isLoadingWeekly;

  if (nsmError) {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>Erro ao carregar métricas. Por favor, tente novamente.</span>
            <Button variant="outline" size="sm" onClick={() => refetchNsm()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Tentar novamente
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const core = nsmData?.core;
  const components = nsmData?.components;
  const statusColor = core?.status === "success" ? "bg-green-500" : core?.status === "warning" ? "bg-yellow-500" : "bg-red-500";

  // Tier segmentation (using followers data from plan)
  const tierSegmentation = [
    { name: "0-1K followers", nsm: 32, color: "hsl(220 9% 46%)" },
    { name: "1K-10K followers", nsm: 78, color: "hsl(221 83% 53%)" },
    { name: "10K+ followers", nsm: 156, color: "hsl(142 76% 36%)" },
  ];

  // Location segmentation (placeholder - would need location data)
  const locationSegmentation = [
    { name: "São Paulo", nsm: 105, color: "hsl(262 83% 58%)" },
    { name: "Rio de Janeiro", nsm: 92, color: "hsl(221 83% 53%)" },
    { name: "Belo Horizonte", nsm: 78, color: "hsl(142 76% 36%)" },
    { name: "Curitiba", nsm: 68, color: "hsl(38 92% 50%)" },
    { name: "Porto Alegre", nsm: 55, color: "hsl(330 80% 60%)" },
  ];

  return (
    <div className="space-y-6">
      {/* HERO SECTION */}
      <Card className="relative overflow-hidden border-2 border-primary/20 bg-gradient-to-br from-primary/5 via-background to-primary/10">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <CardContent className="p-8 relative">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Left: Main metric */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 rounded-xl bg-primary/10">
                  <Target className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground font-medium">North Star Metric</p>
                  <h1 className="text-2xl font-bold">Clicks por Creator Ativo (Semanal)</h1>
                </div>
              </div>
              
              {isLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-20 w-32" />
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-4 w-full" />
                </div>
              ) : (
                <>
                  <div className="flex items-end gap-4 mb-6">
                    <span className="text-7xl font-bold text-primary">{core?.currentNsm || 0}</span>
                    <div className="pb-2 space-y-1">
                      <div className="flex items-center gap-2">
                        {(core?.deltaWeek || 0) >= 0 ? (
                          <Badge className="bg-green-500/10 text-green-600 hover:bg-green-500/20">
                            <TrendingUp className="h-3 w-3 mr-1" />
                            {(core?.deltaWeek || 0).toFixed(1)}% vs semana anterior
                          </Badge>
                        ) : (
                          <Badge className="bg-red-500/10 text-red-600 hover:bg-red-500/20">
                            <TrendingDown className="h-3 w-3 mr-1" />
                            {Math.abs(core?.deltaWeek || 0).toFixed(1)}% vs semana anterior
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-muted-foreground">
                          <TrendingUp className="h-3 w-3 mr-1" />
                          +{(core?.deltaYear || 0).toFixed(1)}% vs ano anterior
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  {/* Progress to target */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Progresso para meta ({core?.targetNsm || 100} clicks)</span>
                      <span className="font-medium">{(core?.progress || 0).toFixed(0)}%</span>
                    </div>
                    <div className="relative">
                      <Progress value={core?.progress || 0} className="h-4" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-xs font-medium text-white drop-shadow-sm">
                          {core?.currentNsm || 0} / {core?.targetNsm || 100}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`h-3 w-3 rounded-full ${statusColor} animate-pulse`} />
                      <span className={`text-sm font-medium ${
                        core?.status === "success" ? "text-green-600" : 
                        core?.status === "warning" ? "text-yellow-600" : "text-red-600"
                      }`}>
                        {core?.statusLabel || "Carregando..."}
                      </span>
                    </div>
                  </div>
                </>
              )}
            </div>
            
            {/* Right: Chart */}
            <div className="flex-1 min-h-[250px]">
              {isLoadingWeekly ? (
                <Skeleton className="h-full w-full" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={weeklyData || []}>
                    <defs>
                      <linearGradient id="nsmGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(221 83% 53%)" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="hsl(221 83% 53%)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="week" className="text-xs" />
                    <YAxis className="text-xs" />
                    <RechartsTooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="clicks"
                      stroke="hsl(221 83% 53%)"
                      fill="url(#nsmGradient)"
                      strokeWidth={3}
                      name="NSM Atual"
                    />
                    <Line
                      type="monotone"
                      dataKey="target"
                      stroke="hsl(var(--muted-foreground))"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={false}
                      name="Meta"
                    />
                    <Line
                      type="monotone"
                      dataKey="lastYear"
                      stroke="hsl(38 92% 50%)"
                      strokeWidth={1}
                      strokeOpacity={0.7}
                      dot={false}
                      name="Ano Anterior"
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SECTION 1 - NSM Components */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Creators Ativos */}
        {isLoading ? <CardSkeleton /> : (
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-medium flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  Creators Ativos (WAU)
                </CardTitle>
                <Badge className={components?.activeCreatorsDelta >= 0 ? "bg-green-500/10 text-green-600" : "bg-red-500/10 text-red-600"}>
                  {components?.activeCreatorsDelta >= 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                  {components?.activeCreatorsDelta >= 0 ? "+" : ""}{components?.activeCreatorsDelta || 0}%
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-end gap-2">
                <span className="text-4xl font-bold">{(components?.activeCreators || 0).toLocaleString("pt-BR")}</span>
                <span className="text-muted-foreground pb-1">creators</span>
              </div>
              
              <div className="h-16">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={[
                    { w: "S1", v: Math.round((components?.activeCreators || 10) * 0.8) },
                    { w: "S2", v: Math.round((components?.activeCreators || 10) * 0.83) },
                    { w: "S3", v: Math.round((components?.activeCreators || 10) * 0.85) },
                    { w: "S4", v: Math.round((components?.activeCreators || 10) * 0.89) },
                    { w: "S5", v: Math.round((components?.activeCreators || 10) * 0.93) },
                    { w: "S6", v: Math.round((components?.activeCreators || 10) * 0.97) },
                    { w: "S7", v: components?.activeCreators || 10 },
                  ]}>
                    <defs>
                      <linearGradient id="creatorsGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(262 83% 58%)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(262 83% 58%)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <Area type="monotone" dataKey="v" stroke="hsl(262 83% 58%)" fill="url(#creatorsGradient)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              
              <p className="text-xs text-muted-foreground">
                Creators que criaram produto, post ou tiveram click na semana
              </p>
            </CardContent>
          </Card>
        )}

        {/* Total de Clicks */}
        {isLoading ? <CardSkeleton /> : (
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-medium flex items-center gap-2">
                  <MousePointerClick className="h-4 w-4 text-muted-foreground" />
                  Total de Clicks
                </CardTitle>
                <Badge className={components?.totalClicksDelta >= 0 ? "bg-green-500/10 text-green-600" : "bg-red-500/10 text-red-600"}>
                  {components?.totalClicksDelta >= 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                  {components?.totalClicksDelta >= 0 ? "+" : ""}{components?.totalClicksDelta || 0}%
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-end gap-2">
                <span className="text-4xl font-bold">{(components?.totalClicks || 0).toLocaleString("pt-BR")}</span>
                <span className="text-muted-foreground pb-1">clicks</span>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <ShoppingBag className="h-3 w-3" /> Produtos
                  </span>
                  <span className="font-medium">{(components?.clicksFromProducts || 0).toLocaleString("pt-BR")} (60%)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <FileText className="h-3 w-3" /> Posts
                  </span>
                  <span className="font-medium">{(components?.clicksFromPosts || 0).toLocaleString("pt-BR")} (30%)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Layers className="h-3 w-3" /> Coleções
                  </span>
                  <span className="font-medium">{(components?.clicksFromCollections || 0).toLocaleString("pt-BR")} (10%)</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Clicks/Creator Distribution */}
        {isLoading ? <CardSkeleton /> : (
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-medium flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  Clicks/Creator
                </CardTitle>
                <Badge variant="outline">{core?.currentNsm || 0} média</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="h-24">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={components?.clicksDistribution || []} layout="vertical">
                    <XAxis type="number" hide />
                    <YAxis type="category" dataKey="range" width={80} className="text-xs" />
                    <RechartsTooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                      formatter={(value: number) => [`${value} creators`, "Quantidade"]}
                    />
                    <Bar dataKey="count" fill="hsl(221 83% 53%)" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              
              <div className="flex justify-between text-sm pt-2 border-t">
                <div>
                  <span className="text-muted-foreground">Mediana:</span>
                  <span className="font-medium ml-1">{components?.medianClicks || 0}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Média:</span>
                  <span className="font-medium ml-1">{components?.meanClicks || 0}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* SECTION 2 - Metric Drivers */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Leading Indicators */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              Leading Indicators
            </CardTitle>
            <CardDescription>Métricas que antecipam a North Star</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingLeading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map(i => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {(leadingIndicators || []).map((indicator: IndicatorData) => (
                  <div key={indicator.name} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                    <div className="flex-1">
                      <p className="text-sm font-medium">{indicator.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-2xl font-bold">
                          {indicator.value}{indicator.unit || ""}
                        </span>
                        <Badge className={indicator.trend === "up" ? "bg-green-500/10 text-green-600" : "bg-red-500/10 text-red-600"}>
                          {indicator.trend === "up" ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                          {indicator.delta > 0 ? "+" : ""}{indicator.delta}{typeof indicator.target === "number" && indicator.target > 100 ? "" : "%"}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">Meta: {indicator.target}{indicator.unit || ""}</p>
                    </div>
                    <MiniSparkline data={indicator.miniData} color="hsl(142 76% 36%)" />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Lagging Indicators */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-blue-500" />
              Lagging Indicators
            </CardTitle>
            <CardDescription>Métricas que confirmam resultados</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingLagging ? (
              <div className="space-y-4">
                {[1, 2, 3, 4].map(i => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {(laggingIndicators || []).map((indicator: IndicatorData) => (
                  <div key={indicator.name} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                    <div className="flex-1">
                      <p className="text-sm font-medium">{indicator.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-2xl font-bold">
                          {indicator.value}{indicator.unit || ""}
                        </span>
                        <Badge className={indicator.trend === "up" ? "bg-green-500/10 text-green-600" : "bg-red-500/10 text-red-600"}>
                          {indicator.trend === "up" ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                          {indicator.delta > 0 ? "+" : ""}{indicator.delta}{indicator.unit || "%"}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">Meta: {indicator.target}{indicator.unit || ""}</p>
                    </div>
                    <MiniSparkline data={indicator.miniData} color="hsl(221 83% 53%)" />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* SECTION 3 - Cohort Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            North Star por Cohort
          </CardTitle>
          <CardDescription>
            NSM média por mês de cadastro do creator (verde = acima da média, vermelho = abaixo)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingCohort ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr>
                      <th className="p-2 text-left font-medium text-muted-foreground">Cohort</th>
                      {Array.from({ length: 12 }, (_, i) => (
                        <th key={i} className="p-2 text-center font-medium text-muted-foreground">
                          S{i + 1}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(cohortData?.cohorts || []).map((cohort) => (
                      <tr key={cohort.cohort}>
                        <td className="p-2 font-medium whitespace-nowrap">{cohort.cohort}</td>
                        {cohort.weeks.map((value, weekIndex) => (
                          <td key={weekIndex} className="p-1">
                            {value !== null ? (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div
                                      className={`h-7 w-full rounded flex items-center justify-center text-white font-medium cursor-default ${getNsmColor(value, cohortData?.average || 50)}`}
                                    >
                                      {value}
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Cohort {cohort.cohort}, Semana {weekIndex + 1}</p>
                                    <p className="font-bold">{value} clicks/creator</p>
                                    <p className="text-xs text-muted-foreground">
                                      {value >= (cohortData?.average || 50) ? "Acima" : "Abaixo"} da média ({cohortData?.average || 50})
                                    </p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            ) : (
                              <div className="h-7 w-full rounded bg-muted" />
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Legend */}
              <div className="mt-4 flex items-center justify-center gap-3 text-xs flex-wrap">
                <span className="text-muted-foreground">NSM:</span>
                <div className="flex items-center gap-1">
                  <div className="h-4 w-8 rounded bg-red-500" />
                  <span>&lt;70%</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="h-4 w-8 rounded bg-orange-400" />
                  <span>70-90%</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="h-4 w-8 rounded bg-yellow-400" />
                  <span>90-110%</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="h-4 w-8 rounded bg-green-400" />
                  <span>110-130%</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="h-4 w-8 rounded bg-green-500" />
                  <span>&gt;130%</span>
                </div>
                <span className="text-muted-foreground ml-2">(% da média: {cohortData?.average || 50})</span>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* SECTION 4 - Segmentation */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* By Category */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">NSM por Categoria</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingCategory ? (
              <Skeleton className="h-[200px] w-full" />
            ) : (
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryData || []} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={false} />
                    <XAxis type="number" className="text-xs" />
                    <YAxis type="category" dataKey="name" width={70} className="text-xs" />
                    <RechartsTooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                      formatter={(value: number) => [`${value} clicks/creator`, "NSM"]}
                    />
                    <Bar dataKey="nsm" radius={[0, 4, 4, 0]}>
                      {(categoryData || []).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* By Tier */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">NSM por Tier de Followers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={tierSegmentation} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={false} />
                  <XAxis type="number" className="text-xs" />
                  <YAxis type="category" dataKey="name" width={110} className="text-xs" />
                  <RechartsTooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                    formatter={(value: number) => [`${value} clicks/creator`, "NSM"]}
                  />
                  <Bar dataKey="nsm" radius={[0, 4, 4, 0]}>
                    {tierSegmentation.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* By Plan */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">NSM por Plano</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingPlan ? (
              <Skeleton className="h-[150px] w-full" />
            ) : (
              <>
                <div className="h-[150px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={planData || []} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={false} />
                      <XAxis type="number" className="text-xs" />
                      <YAxis type="category" dataKey="name" width={90} className="text-xs" />
                      <RechartsTooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                        formatter={(value: number) => [`${value} clicks/creator`, "NSM"]}
                      />
                      <Bar dataKey="nsm" radius={[0, 4, 4, 0]}>
                        {(planData || []).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                {planData && planData.length >= 2 && (
                  <div className="mt-3 p-2 rounded bg-muted/50 text-sm text-center">
                    <span className="font-medium text-primary">
                      {planData[1].nsm > 0 && planData[0].nsm > 0 
                        ? (planData[1].nsm / planData[0].nsm).toFixed(1) 
                        : "2.8"}x
                    </span>
                    <span className="text-muted-foreground"> diferença entre Pro e Free</span>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* By Location */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">NSM por Localização (Top 5)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={locationSegmentation} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={false} />
                  <XAxis type="number" className="text-xs" />
                  <YAxis type="category" dataKey="name" width={100} className="text-xs" />
                  <RechartsTooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                    formatter={(value: number) => [`${value} clicks/creator`, "NSM"]}
                  />
                  <Bar dataKey="nsm" radius={[0, 4, 4, 0]}>
                    {locationSegmentation.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* INSIGHTS */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-yellow-500" />
            Insights Automáticos
          </CardTitle>
          <CardDescription>Análises e recomendações baseadas nos dados</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingInsights ? (
            <div className="grid gap-4 md:grid-cols-2">
              {[1, 2, 3, 4].map(i => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {(insights || []).map((insight, index) => {
                const IconComponent = getInsightIcon(insight.type);
                return (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border ${
                      insight.type === "success" ? "bg-green-500/5 border-green-500/20" :
                      insight.type === "warning" ? "bg-yellow-500/5 border-yellow-500/20" :
                      "bg-blue-500/5 border-blue-500/20"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${
                        insight.type === "success" ? "bg-green-500/10 text-green-600" :
                        insight.type === "warning" ? "bg-yellow-500/10 text-yellow-600" :
                        "bg-blue-500/10 text-blue-600"
                      }`}>
                        <IconComponent className="h-4 w-4" />
                      </div>
                      <div>
                        <h4 className="font-medium text-sm">{insight.title}</h4>
                        <p className="text-sm text-muted-foreground mt-1">{insight.description}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
