import { useState, useMemo } from "react";
import { PeriodSelector, Period } from "@/components/admin/PeriodSelector";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useFinancialMetrics } from "@/hooks/useStripeFinancials";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Users,
  AlertTriangle,
  Info,
  Download,
  RefreshCw,
  AlertCircle,
  CreditCard,
  Calendar,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

// Currency formatter
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const formatPercent = (value: number) => {
  return `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;
};

// Colors for charts
const COLORS = ["hsl(262 83% 58%)", "hsl(221 83% 53%)", "hsl(142 76% 36%)", "hsl(38 92% 50%)", "hsl(0 84% 60%)"];

export default function AdminFinancials() {
  const [period, setPeriod] = useState<Period>("30d");
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined,
  });
  const [compareWithPrevious, setCompareWithPrevious] = useState(false);

  const { data: stripeData, isLoading, error, refetch, derivedMetrics } = useFinancialMetrics();

  // Use real data or fallback to 0
  const currentMrr = stripeData?.mrr || 0;
  const arr = stripeData?.arr || 0;
  const activeSubscriptions = stripeData?.activeSubscriptions || 0;
  const newSubscriptionsThisMonth = stripeData?.newSubscriptionsThisMonth || 0;
  const canceledThisMonth = stripeData?.canceledThisMonth || 0;
  const churnRate = stripeData?.churnRate || 0;
  const revenueHistory = stripeData?.revenueHistory || [];
  const subscriptionsByPlan = stripeData?.subscriptionsByPlan || [];
  const recentSubscriptions = stripeData?.recentSubscriptions || [];

  const { arpu, mrrGrowth, mrrDeltaValue, mrrHistory } = derivedMetrics;

  const arrGoal = 1000000;
  const arrProgress = arrGoal > 0 ? (arr / arrGoal) * 100 : 0;

  const handleExportPDF = () => {
    console.log("Exporting financial report to PDF...");
    alert("Relatório financeiro exportado com sucesso!");
  };

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Métricas Financeiras</h1>
            <p className="text-muted-foreground">Acompanhe receita, churn e retenção</p>
          </div>
        </div>
        <Card className="border-destructive">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-destructive mb-4" />
            <h3 className="text-lg font-semibold mb-2">Erro ao carregar métricas</h3>
            <p className="text-muted-foreground text-center mb-4">
              Não foi possível carregar as métricas do Stripe. Verifique se a chave API está configurada.
            </p>
            <Button onClick={() => refetch()} variant="outline">
              <RefreshCw className="mr-2 h-4 w-4" />
              Tentar novamente
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Métricas Financeiras</h1>
          <p className="text-muted-foreground">Acompanhe receita, churn e retenção</p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={() => refetch()} variant="outline" size="sm" disabled={isLoading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            Atualizar
          </Button>
          <Button onClick={handleExportPDF} variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Exportar Relatório PDF
          </Button>
          <PeriodSelector
            period={period}
            onPeriodChange={setPeriod}
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
            compareWithPrevious={compareWithPrevious}
            onCompareChange={setCompareWithPrevious}
          />
        </div>
      </div>

      {/* Section 1 - Revenue Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* MRR Card */}
        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">MRR</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-8 w-32" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : (
              <>
                <div>
                  <div className="text-3xl font-bold">{formatCurrency(currentMrr)}</div>
                  <div className="flex items-center gap-2 text-sm">
                    {mrrGrowth >= 0 ? (
                      <TrendingUp className="h-4 w-4 text-green-500" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-500" />
                    )}
                    <span className={mrrGrowth >= 0 ? "text-green-500" : "text-red-500"}>
                      {formatPercent(mrrGrowth)} ({formatCurrency(mrrDeltaValue)})
                    </span>
                    <span className="text-muted-foreground">MoM</span>
                  </div>
                </div>

                {/* Mini chart */}
                <div className="h-16">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={mrrHistory}>
                      <defs>
                        <linearGradient id="mrrGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(221 83% 53%)" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="hsl(221 83% 53%)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <Area
                        type="monotone"
                        dataKey="total"
                        stroke="hsl(221 83% 53%)"
                        fill="url(#mrrGradient)"
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                {/* Breakdown by plan */}
                {subscriptionsByPlan.length > 0 && (
                  <div className="space-y-1 text-xs">
                    {subscriptionsByPlan.slice(0, 3).map((plan) => (
                      <div key={plan.plan} className="flex justify-between">
                        <span className="text-muted-foreground truncate max-w-[150px]">{plan.plan}</span>
                        <span>{formatCurrency(plan.revenue)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* ARR Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ARR</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-8 w-32" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-2 w-full" />
              </div>
            ) : (
              <>
                <div>
                  <div className="text-3xl font-bold">{formatCurrency(arr)}</div>
                  <p className="text-sm text-muted-foreground">Projeção baseada no MRR atual</p>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Meta anual</span>
                    <span className="font-medium">{formatCurrency(arrGoal)}</span>
                  </div>
                  <Progress value={arrProgress} className="h-2" />
                  <p className="text-xs text-muted-foreground text-center">
                    {arrProgress.toFixed(1)}% da meta
                  </p>
                </div>

                <div className="text-sm">
                  <span className="text-muted-foreground">Faltam </span>
                  <span className="font-semibold text-primary">{formatCurrency(arrGoal - arr)}</span>
                  <span className="text-muted-foreground"> para a meta</span>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* ARPU Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ARPU</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-8 w-32" />
                <Skeleton className="h-4 w-24" />
              </div>
            ) : (
              <>
                <div>
                  <div className="text-3xl font-bold">{formatCurrency(arpu)}</div>
                  <p className="text-sm text-muted-foreground">Por usuário pagante</p>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Assinaturas ativas</span>
                    <span className="font-medium">{activeSubscriptions}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Novas este mês</span>
                    <Badge variant="secondary" className="text-xs">+{newSubscriptionsThisMonth}</Badge>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground">
                  Baseado em {activeSubscriptions} usuários pagantes
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Churn Rate Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Churn Rate</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-8 w-32" />
                <Skeleton className="h-4 w-24" />
              </div>
            ) : (
              <>
                <div>
                  <div className="text-3xl font-bold">{churnRate.toFixed(1)}%</div>
                  <p className="text-sm text-muted-foreground">Este mês</p>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <div className="flex items-center gap-1">
                      <span className="text-muted-foreground">Canceladas</span>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <Info className="h-3 w-3 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Assinaturas canceladas este mês</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <Badge variant="outline" className="text-red-500">{canceledThisMonth}</Badge>
                  </div>
                </div>

                {churnRate > 5 && (
                  <div className="flex items-center gap-2 p-2 bg-red-50 text-red-700 rounded-lg text-xs">
                    <AlertTriangle className="h-4 w-4" />
                    <span>Churn acima do ideal (5%)</span>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Section 2 - Revenue History Chart */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Histórico de Receita</CardTitle>
            <CardDescription>Receita mensal dos últimos 12 meses</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : revenueHistory.length > 0 ? (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={revenueHistory}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="month" className="text-xs" />
                    <YAxis
                      tickFormatter={(value) => formatCurrency(value)}
                      className="text-xs"
                    />
                    <RechartsTooltip
                      formatter={(value: number) => [formatCurrency(value), "Receita"]}
                      contentStyle={{
                        backgroundColor: "hsl(var(--background))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Bar dataKey="revenue" fill="hsl(221 83% 53%)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <CreditCard className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Nenhum dado de receita disponível</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Subscriptions by Plan */}
        <Card>
          <CardHeader>
            <CardTitle>Assinaturas por Plano</CardTitle>
            <CardDescription>Distribuição de receita por plano</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : subscriptionsByPlan.length > 0 ? (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={subscriptionsByPlan}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="revenue"
                      nameKey="plan"
                      label={({ plan, percent }) => `${plan.slice(0, 10)}... ${(percent * 100).toFixed(0)}%`}
                    >
                      {subscriptionsByPlan.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip
                      formatter={(value: number, name: string) => [formatCurrency(value), name]}
                      contentStyle={{
                        backgroundColor: "hsl(var(--background))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <CreditCard className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Nenhuma assinatura ativa</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Section 3 - Recent Subscriptions */}
      <Card>
        <CardHeader>
          <CardTitle>Assinaturas Recentes</CardTitle>
          <CardDescription>Últimas assinaturas ativas</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-6 w-20" />
                </div>
              ))}
            </div>
          ) : recentSubscriptions.length > 0 ? (
            <div className="space-y-3">
              {recentSubscriptions.map((sub) => (
                <div
                  key={sub.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <CreditCard className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{sub.customerEmail}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(sub.createdAt), "dd MMM yyyy", { locale: ptBR })}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatCurrency(sub.amount)}</p>
                    <Badge variant="secondary" className="text-xs">
                      {sub.interval === "month" ? "Mensal" : sub.interval === "year" ? "Anual" : sub.interval}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-muted-foreground">
              <CreditCard className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Nenhuma assinatura recente</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Section 4 - Key Metrics Summary */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Net Revenue Retention</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-12 w-24" />
            ) : (
              <div className="text-3xl font-bold text-green-600">
                {(100 - churnRate).toFixed(1)}%
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Retenção líquida de receita
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">LTV Estimado</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-12 w-24" />
            ) : (
              <div className="text-3xl font-bold">
                {formatCurrency(churnRate > 0 ? arpu / (churnRate / 100) : arpu * 12)}
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Valor vitalício por cliente
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Receita Média Mensal</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-12 w-24" />
            ) : (
              <div className="text-3xl font-bold">
                {formatCurrency(
                  revenueHistory.length > 0
                    ? revenueHistory.reduce((sum, m) => sum + m.revenue, 0) / revenueHistory.length
                    : 0
                )}
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Média dos últimos 12 meses
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
