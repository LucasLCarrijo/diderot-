import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  BarChart, Bar, LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip as RechartsTooltip, ResponsiveContainer, Legend, ComposedChart,
  Cell
} from "recharts";
import { 
  Download, FileText, TrendingUp, Users, Clock, 
  ArrowDown, Lightbulb, Filter, Layers, Activity,
  Target, Repeat, Heart, MousePointer, ArrowRight,
  Mail, Bell, Smartphone, Star,
  Package, Image, FolderOpen, Crown, AlertTriangle
} from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Progress } from "@/components/ui/progress";
import {
  useCohortAnalysis,
  useFunnelAnalysis,
  useRetentionMetrics,
  useEngagementMetrics,
  useResurrectionData,
  CohortBy,
  CohortMetric,
  CohortPeriod,
  RetentionRole,
  RetentionPlan,
} from "@/hooks/useAdvancedAnalytics";
import { useAdminExport } from "@/hooks/useAdminExport";

// Helper functions
const formatNumber = (value: number) => value.toLocaleString('pt-BR');

const getCohortColor = (value: number, metric: CohortMetric) => {
  if (metric === "retention") {
    if (value >= 70) return "bg-emerald-500";
    if (value >= 50) return "bg-emerald-400";
    if (value >= 35) return "bg-yellow-400";
    if (value >= 20) return "bg-orange-400";
    return "bg-red-400";
  }
  return "bg-primary/80";
};

export default function AdminAnalytics() {
  const [activeTab, setActiveTab] = useState("cohort");
  
  // Cohort state
  const [cohortBy, setCohortBy] = useState<CohortBy>("signup");
  const [cohortMetric, setCohortMetric] = useState<CohortMetric>("retention");
  const [cohortPeriod, setCohortPeriod] = useState<CohortPeriod>("monthly");

  // Funnel state
  const [selectedFunnel, setSelectedFunnel] = useState<string>("signup_product_click");

  // Retention state
  const [retentionRole, setRetentionRole] = useState<RetentionRole>("all");
  const [retentionPlan, setRetentionPlan] = useState<RetentionPlan>("all");

  // Engagement state
  const [selectedFeatureHistory, setSelectedFeatureHistory] = useState<string>("produto");

  // Fetch real data from hooks
  const { data: cohortData, isLoading: cohortLoading, error: cohortError } = useCohortAnalysis(cohortMetric, cohortPeriod);
  const { data: funnelData, isLoading: funnelLoading, error: funnelError } = useFunnelAnalysis();
  const { data: retentionData, isLoading: retentionLoading, error: retentionError } = useRetentionMetrics(retentionRole, retentionPlan);
  const { data: engagementData, isLoading: engagementLoading, error: engagementError } = useEngagementMetrics();
  const { data: resurrectionData, isLoading: resurrectionLoading } = useResurrectionData();
  const { exportAnalytics, exportClicks, isExporting } = useAdminExport();

  const currentFunnel = funnelData?.[selectedFunnel as keyof typeof funnelData];

  const handleExportPDF = () => {
    console.log("Exporting PDF...");
  };

  // Error state
  if (cohortError || funnelError || retentionError || engagementError) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h3 className="font-semibold mb-2">Erro ao carregar analytics</h3>
          <p className="text-sm text-muted-foreground">
            Tente novamente mais tarde
          </p>
        </div>
      </div>
    );
  }

  // Feature adoption icons
  const featureIcons: Record<string, typeof Package> = {
    "Criou Produto": Package,
    "Criou Post com Pins": Image,
    "Criou Coleção": FolderOpen,
    "Upgrade para Pro": Crown,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics Avançado</h1>
          <p className="text-muted-foreground">
            Análise profunda de cohorts, funis, retenção e engajamento
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => exportAnalytics()}
            disabled={isExporting}
          >
            <Download className="mr-2 h-4 w-4" />
            {isExporting ? "Exportando..." : "Exportar CSV"}
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => exportClicks()}
            disabled={isExporting}
          >
            <FileText className="mr-2 h-4 w-4" />
            Exportar Cliques
          </Button>
        </div>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:w-[500px]">
          <TabsTrigger value="cohort" className="flex items-center gap-2">
            <Layers className="h-4 w-4" />
            Cohort
          </TabsTrigger>
          <TabsTrigger value="funnel" className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Funnel
          </TabsTrigger>
          <TabsTrigger value="retention" className="flex items-center gap-2">
            <Repeat className="h-4 w-4" />
            Retenção
          </TabsTrigger>
          <TabsTrigger value="engagement" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Engajamento
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: Cohort Analysis */}
        <TabsContent value="cohort" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-wrap gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Cohort por</label>
                  <Select value={cohortBy} onValueChange={(v) => setCohortBy(v as CohortBy)}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="signup">Data de Cadastro</SelectItem>
                      <SelectItem value="first_product">Data do Primeiro Produto</SelectItem>
                      <SelectItem value="upgrade_pro">Data do Upgrade Pro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Métrica</label>
                  <Select value={cohortMetric} onValueChange={(v) => setCohortMetric(v as CohortMetric)}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="retention">Retenção</SelectItem>
                      <SelectItem value="mrr">MRR</SelectItem>
                      <SelectItem value="clicks">Clicks</SelectItem>
                      <SelectItem value="products">Produtos Criados</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Período</label>
                  <ToggleGroup 
                    type="single" 
                    value={cohortPeriod} 
                    onValueChange={(v) => v && setCohortPeriod(v as CohortPeriod)}
                  >
                    <ToggleGroupItem value="weekly">Semanal</ToggleGroupItem>
                    <ToggleGroupItem value="monthly">Mensal</ToggleGroupItem>
                  </ToggleGroup>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Cohort Heatmap */}
          <Card>
            <CardHeader>
              <CardTitle>Análise de Cohort - {cohortMetric === "retention" ? "Retenção" : cohortMetric === "mrr" ? "MRR" : cohortMetric === "clicks" ? "Clicks" : "Produtos"}</CardTitle>
              <CardDescription>
                {cohortBy === "signup" ? "Por data de cadastro" : cohortBy === "first_product" ? "Por data do primeiro produto" : "Por data do upgrade Pro"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {cohortLoading ? (
                <div className="space-y-4">
                  {[...Array(6)].map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : cohortData && cohortData.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr>
                        <th className="text-left p-2 font-medium text-muted-foreground">Cohort</th>
                        <th className="text-center p-2 font-medium text-muted-foreground">Tamanho</th>
                        {Array.from({ length: 8 }, (_, i) => (
                          <th key={i} className="text-center p-2 font-medium text-muted-foreground">
                            {cohortPeriod === "weekly" ? `S${i}` : `M${i}`}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {cohortData.map((row, rowIdx) => (
                        <tr key={rowIdx}>
                          <td className="p-2 font-medium">{row.cohort}</td>
                          <td className="text-center p-2">
                            <Badge variant="secondary">{row.size}</Badge>
                          </td>
                          {Array.from({ length: 8 }, (_, colIdx) => {
                            const value = row[`p${colIdx}`] as number | undefined;
                            if (value === undefined) {
                              return <td key={colIdx} className="p-1"></td>;
                            }
                            return (
                              <TooltipProvider key={colIdx}>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <td className="p-1">
                                      <div 
                                        className={`${getCohortColor(value, cohortMetric)} text-white rounded p-2 text-center text-xs font-medium cursor-default transition-transform hover:scale-105`}
                                      >
                                        {cohortMetric === "retention" ? `${value}%` : 
                                         cohortMetric === "mrr" ? `R$${(value/1000).toFixed(1)}k` :
                                         formatNumber(value)}
                                      </div>
                                    </td>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p className="font-medium">{row.cohort}</p>
                                    <p>{cohortPeriod === "weekly" ? `Semana ${colIdx}` : `Mês ${colIdx}`}</p>
                                    <p className="text-primary">
                                      {cohortMetric === "retention" ? `${value}% retenção` : 
                                       cohortMetric === "mrr" ? `R$ ${formatNumber(value)}` :
                                       `${formatNumber(value)} ${cohortMetric}`}
                                    </p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="flex items-center justify-center h-48 text-muted-foreground">
                  Nenhum dado de cohort disponível
                </div>
              )}
            </CardContent>
          </Card>

          {/* Insights */}
          <div className="grid gap-6 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-yellow-500" />
                  Insights
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                  <p className="text-sm font-medium text-emerald-600">Melhor Cohort</p>
                  <p className="text-sm text-muted-foreground">
                    {cohortData?.[0]?.cohort || "—"} com {cohortData?.[0]?.size || 0} usuários
                  </p>
                </div>
                <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                  <p className="text-sm font-medium text-blue-600">Tendência</p>
                  <p className="text-sm text-muted-foreground">
                    Análise baseada em dados reais do período
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tamanho dos Cohorts</CardTitle>
              </CardHeader>
              <CardContent>
                {cohortLoading ? (
                  <Skeleton className="h-[200px] w-full" />
                ) : (
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={cohortData || []}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="cohort" className="text-xs" tick={{ fontSize: 10 }} />
                      <YAxis className="text-xs" />
                      <RechartsTooltip />
                      <Bar dataKey="size" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Retenção Comparativa</CardTitle>
              </CardHeader>
              <CardContent>
                {retentionLoading ? (
                  <Skeleton className="h-[200px] w-full" />
                ) : (
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={retentionData?.cohortCurves || []}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="day" className="text-xs" />
                      <YAxis className="text-xs" />
                      <RechartsTooltip />
                      <Line type="monotone" dataKey="cohort1" stroke="hsl(var(--primary))" name="Cohort 1" strokeWidth={2} />
                      <Line type="monotone" dataKey="benchmark" stroke="hsl(var(--muted-foreground))" name="Benchmark" strokeWidth={2} strokeDasharray="5 5" />
                      <Legend />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* TAB 2: Funnel Analysis */}
        <TabsContent value="funnel" className="space-y-6">
          {/* Funnel Selector */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-wrap gap-4 items-end">
                <div className="space-y-2 flex-1">
                  <label className="text-sm font-medium">Funil Predefinido</label>
                  <Select value={selectedFunnel} onValueChange={setSelectedFunnel}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="signup_product_click">Signup → Primeiro Produto → Primeiro Click</SelectItem>
                      <SelectItem value="signup_pro">Signup → Creator Pro</SelectItem>
                      <SelectItem value="visitor_active">Visitor → Signup → Active User</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Funnel Visualization */}
          <Card>
            <CardHeader>
              <CardTitle>{currentFunnel?.name || "Funil"}</CardTitle>
              <CardDescription>Análise de conversão por etapa</CardDescription>
            </CardHeader>
            <CardContent>
              {funnelLoading ? (
                <div className="space-y-4">
                  {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : currentFunnel ? (
                <div className="space-y-4">
                  {currentFunnel.steps.map((step, idx) => {
                    const prevValue = idx === 0 ? step.value : currentFunnel.steps[idx - 1].value;
                    const conversionRate = idx === 0 ? 100 : ((step.value / prevValue) * 100);
                    const totalConversion = (step.value / currentFunnel.steps[0].value) * 100;
                    const dropOff = idx === 0 ? 0 : ((prevValue - step.value) / prevValue) * 100;
                    const widthPercent = (step.value / currentFunnel.steps[0].value) * 100;

                    return (
                      <div key={idx} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{step.name}</span>
                            {step.avgTime && (
                              <Badge variant="outline" className="text-xs">
                                <Clock className="mr-1 h-3 w-3" />
                                {step.avgTime}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-muted-foreground">
                            <span>{formatNumber(step.value)} usuários</span>
                            <span className="text-primary font-medium">{totalConversion.toFixed(1)}%</span>
                          </div>
                        </div>
                        <div className="relative">
                          <div className="h-12 bg-muted rounded-lg overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-primary to-primary/70 flex items-center justify-center text-primary-foreground font-medium transition-all duration-500"
                              style={{ width: `${widthPercent}%` }}
                            >
                              {widthPercent > 15 && formatNumber(step.value)}
                            </div>
                          </div>
                          {idx > 0 && (
                            <div className="absolute -top-6 right-0 flex items-center gap-2 text-xs">
                              <span className="text-emerald-600">Conv: {conversionRate.toFixed(1)}%</span>
                              <span className="text-red-500">Drop: {dropOff.toFixed(1)}%</span>
                            </div>
                          )}
                        </div>
                        {idx < currentFunnel.steps.length - 1 && (
                          <div className="flex justify-center py-1">
                            <ArrowDown className="h-5 w-5 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex items-center justify-center h-48 text-muted-foreground">
                  Selecione um funil para visualizar
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 3: Retention */}
        <TabsContent value="retention" className="space-y-6">
          {/* Global Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-wrap gap-4 items-end">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Filtrar por Role</label>
                  <Select value={retentionRole} onValueChange={(v) => setRetentionRole(v as RetentionRole)}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="creators">Creators</SelectItem>
                      <SelectItem value="followers">Followers</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Filtrar por Plano</label>
                  <Select value={retentionPlan} onValueChange={(v) => setRetentionPlan(v as RetentionPlan)}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="free">Free</SelectItem>
                      <SelectItem value="pro">Pro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Retention Curves */}
          <Card>
            <CardHeader>
              <CardTitle>Curvas de Retenção por Cohort</CardTitle>
              <CardDescription>
                Múltiplos cohorts comparados ao longo do tempo com linha de benchmark
              </CardDescription>
            </CardHeader>
            <CardContent>
              {retentionLoading ? (
                <Skeleton className="h-[400px] w-full" />
              ) : (
                <ResponsiveContainer width="100%" height={400}>
                  <ComposedChart data={retentionData?.cohortCurves || []}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="day" className="text-xs" />
                    <YAxis className="text-xs" tickFormatter={(v) => `${v}%`} domain={[0, 100]} />
                    <RechartsTooltip formatter={(value) => `${value}%`} />
                    <Area 
                      type="monotone" 
                      dataKey="cohort1"
                      name="Cohort 1"
                      stroke="hsl(var(--primary))"
                      fill="hsl(var(--primary))"
                      fillOpacity={0.2}
                      strokeWidth={2}
                    />
                    <Line type="monotone" dataKey="cohort2" name="Cohort 2" stroke="hsl(142 76% 36%)" strokeWidth={2} />
                    <Line type="monotone" dataKey="cohort3" name="Cohort 3" stroke="hsl(38 92% 50%)" strokeWidth={2} />
                    <Line 
                      type="monotone" 
                      dataKey="benchmark" 
                      name="Benchmark (Indústria)"
                      stroke="hsl(var(--muted-foreground))"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                    />
                    <Legend />
                  </ComposedChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Retention Metrics */}
          <div className="grid gap-4 md:grid-cols-4">
            {[
              { label: "D1 Retention", day: "D1", icon: Users },
              { label: "D7 Retention", day: "D7", icon: Repeat },
              { label: "D30 Retention", day: "D30", icon: Heart },
              { label: "D90 Retention", day: "D90", icon: Target },
            ].map((stat, idx) => {
              const value = retentionData?.retention?.[stat.day as keyof typeof retentionData.retention] || 0;
              const Icon = stat.icon;
              return (
                <Card key={idx}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-3">
                      <Icon className="h-6 w-6 text-muted-foreground" />
                      <Badge variant={value >= 50 ? "default" : value >= 30 ? "secondary" : "destructive"}>
                        {value >= 50 ? "Bom" : value >= 30 ? "Médio" : "Baixo"}
                      </Badge>
                    </div>
                    {retentionLoading ? (
                      <Skeleton className="h-10 w-16" />
                    ) : (
                      <>
                        <p className="text-3xl font-bold">{value}%</p>
                        <p className="text-sm text-muted-foreground">{stat.label}</p>
                      </>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Stickiness */}
          <Card>
            <CardHeader>
              <CardTitle>Stickiness (DAU/MAU)</CardTitle>
              <CardDescription>Proporção de usuários ativos diários sobre mensais</CardDescription>
            </CardHeader>
            <CardContent>
              {retentionLoading ? (
                <Skeleton className="h-24 w-full" />
              ) : (
                <div className="flex items-center gap-8">
                  <div>
                    <p className="text-4xl font-bold">{((retentionData?.stickiness?.ratio || 0) * 100).toFixed(1)}%</p>
                    <p className="text-sm text-muted-foreground">DAU/MAU Ratio</p>
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>DAU: {formatNumber(retentionData?.stickiness?.dau || 0)}</span>
                      <span>MAU: {formatNumber(retentionData?.stickiness?.mau || 0)}</span>
                    </div>
                    <Progress value={(retentionData?.stickiness?.ratio || 0) * 100} className="h-3" />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Resurrection Data */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-emerald-500" />
                Reativação de Usuários
              </CardTitle>
              <CardDescription>Performance de campanhas de reativação por canal</CardDescription>
            </CardHeader>
            <CardContent>
              {resurrectionLoading ? (
                <Skeleton className="h-48 w-full" />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3 font-medium">Canal</th>
                        <th className="text-center p-3 font-medium">Dormentes</th>
                        <th className="text-center p-3 font-medium">Campanhas</th>
                        <th className="text-center p-3 font-medium">Reativados</th>
                        <th className="text-center p-3 font-medium">Taxa</th>
                        <th className="p-3 font-medium">Progresso</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(resurrectionData || []).map((row, idx) => (
                        <tr key={idx} className="border-b">
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              {row.channel === "Email" && <Mail className="h-4 w-4 text-muted-foreground" />}
                              {row.channel === "Push" && <Bell className="h-4 w-4 text-muted-foreground" />}
                              {row.channel === "In-app" && <Smartphone className="h-4 w-4 text-muted-foreground" />}
                              {row.channel === "SMS" && <Smartphone className="h-4 w-4 text-muted-foreground" />}
                              <span className="font-medium">{row.channel}</span>
                            </div>
                          </td>
                          <td className="text-center p-3">{formatNumber(row.dormant)}</td>
                          <td className="text-center p-3">{row.campaigns}</td>
                          <td className="text-center p-3 text-emerald-600 font-medium">{formatNumber(row.resurrected)}</td>
                          <td className="text-center p-3">
                            <Badge variant={row.rate >= 15 ? "default" : "secondary"}>
                              {row.rate.toFixed(1)}%
                            </Badge>
                          </td>
                          <td className="p-3">
                            <div className="w-full bg-muted rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full ${row.rate >= 15 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                                style={{ width: `${(row.rate / 25) * 100}%` }}
                              />
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 4: Engagement */}
        <TabsContent value="engagement" className="space-y-6">
          {/* Engagement Score */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5 text-amber-500" />
                Engagement Score
              </CardTitle>
              <CardDescription>
                Score = (Produtos × 10) + (Posts × 15) + (Clicks × 0.5)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {engagementLoading ? (
                <Skeleton className="h-[300px] w-full" />
              ) : (
                <div className="grid gap-6 md:grid-cols-3">
                  {/* Distribution Histogram */}
                  <div className="md:col-span-2">
                    <h4 className="text-sm font-medium mb-4">Distribuição de Usuários por Score</h4>
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={engagementData?.scoreDistribution || []}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="range" className="text-xs" />
                        <YAxis className="text-xs" />
                        <RechartsTooltip 
                          formatter={(value: number, name: string) => [
                            name === "count" ? `${formatNumber(value)} usuários` : `${value}%`,
                            name === "count" ? "Usuários" : "Porcentagem"
                          ]}
                        />
                        <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]}>
                          {(engagementData?.scoreDistribution || []).map((_, idx) => (
                            <Cell 
                              key={idx}
                              fill={idx >= 3 ? "hsl(142 76% 36%)" : "hsl(var(--primary))"}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Top Engaged Users */}
                  <div>
                    <h4 className="text-sm font-medium mb-4">Top 5 Usuários Mais Engajados</h4>
                    <div className="space-y-3">
                      {(engagementData?.topEngagedUsers || []).map((user, idx) => (
                        <div key={idx} className="flex items-center gap-3 p-2 rounded-lg border">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium">
                            #{idx + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{user.name}</p>
                            <p className="text-xs text-muted-foreground">{user.handle}</p>
                          </div>
                          <Badge>{user.score}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Feature Adoption */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Feature Adoption</h3>
            {engagementLoading ? (
              <div className="grid gap-4 md:grid-cols-4">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-32" />
                ))}
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-4">
                {(engagementData?.featureAdoption || []).map((feature, idx) => {
                  const delta = feature.current - feature.prev;
                  const Icon = featureIcons[feature.feature] || Package;
                  return (
                    <Card key={idx}>
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between mb-3">
                          <Icon className="h-6 w-6 text-primary" />
                          <Badge variant={delta >= 0 ? "default" : "destructive"} className="text-xs">
                            {delta >= 0 ? "+" : ""}{delta}%
                          </Badge>
                        </div>
                        <p className="text-2xl font-bold">{feature.current}%</p>
                        <p className="text-xs text-muted-foreground mb-2">{feature.feature}</p>
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span>Meta: {feature.target}%</span>
                          </div>
                          <Progress value={(feature.current / feature.target) * 100} className="h-1" />
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>

          {/* Session Analytics */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Session Analytics</h3>
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-2">
                    <Clock className="h-6 w-6 text-muted-foreground" />
                    <Badge variant={engagementData?.sessionAnalytics?.avgDurationDelta >= 0 ? "default" : "destructive"}>
                      {engagementData?.sessionAnalytics?.avgDurationDelta >= 0 ? "+" : ""}{engagementData?.sessionAnalytics?.avgDurationDelta || 0}%
                    </Badge>
                  </div>
                  <p className="text-3xl font-bold">{engagementData?.sessionAnalytics?.avgDuration || 0} min</p>
                  <p className="text-sm text-muted-foreground">Duração Média de Sessão</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-2">
                    <Layers className="h-6 w-6 text-muted-foreground" />
                    <Badge variant="default">
                      +{engagementData?.sessionAnalytics?.pagesPerSessionDelta || 0}%
                    </Badge>
                  </div>
                  <p className="text-3xl font-bold">{engagementData?.sessionAnalytics?.pagesPerSession || 0}</p>
                  <p className="text-sm text-muted-foreground">Páginas por Sessão</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-2">
                    <ArrowDown className="h-6 w-6 text-muted-foreground" />
                    <Badge variant={(engagementData?.sessionAnalytics?.bounceRateDelta || 0) <= 0 ? "default" : "destructive"}>
                      {engagementData?.sessionAnalytics?.bounceRateDelta || 0}%
                    </Badge>
                  </div>
                  <p className="text-3xl font-bold">{engagementData?.sessionAnalytics?.bounceRate || 0}%</p>
                  <p className="text-sm text-muted-foreground">Bounce Rate</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
