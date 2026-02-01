import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ExternalLink,
  MousePointerClick,
  Heart,
  Eye,
  TrendingUp,
  Smartphone,
  Monitor,
  Tablet,
  Clock,
  AlertTriangle,
  Edit,
  Star,
  Ticket,
  Link as LinkIcon,
  ThumbsUp,
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
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Product {
  id: string;
  title: string;
  slug?: string;
  image_url?: string;
  store?: string;
  price?: number;
  currency?: string;
  monetization_type?: string;
  coupon_code?: string;
  status?: string;
  is_published?: boolean;
  categories?: string[];
  click_count?: number;
  favorite_count?: number;
  description?: string;
  affiliate_url?: string;
  created_at: string;
  updated_at: string;
  profiles?: {
    name: string;
    username: string;
    avatar_url?: string;
  };
}

interface ProductPreviewModalProps {
  product: Product | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Generate mock data for charts
const generateFavoritesHistory = () => {
  const data = [];
  const today = new Date();
  for (let i = 29; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    data.push({
      date: format(date, "dd/MM", { locale: ptBR }),
      favoritos: Math.floor(Math.random() * 50) + 10,
    });
  }
  return data;
};

const deviceDistribution = [
  { name: "Mobile", value: 62, color: "hsl(var(--primary))" },
  { name: "Desktop", value: 31, color: "hsl(var(--muted-foreground))" },
  { name: "Tablet", value: 7, color: "hsl(var(--secondary))" },
];

const topReferrers = [
  { source: "Instagram", visits: 1234, percentage: 45 },
  { source: "Google", visits: 678, percentage: 24 },
  { source: "Direto", visits: 456, percentage: 16 },
  { source: "TikTok", visits: 234, percentage: 8 },
  { source: "Outros", visits: 198, percentage: 7 },
];

const editHistory = [
  { date: "2024-01-15 14:30", user: "admin@diderot.com", action: "Alterou preço de R$ 99 para R$ 89" },
  { date: "2024-01-10 09:15", user: "@mariafashion", action: "Atualizou descrição" },
  { date: "2024-01-05 16:45", user: "@mariafashion", action: "Adicionou cupom SAVE10" },
  { date: "2024-01-01 10:00", user: "@mariafashion", action: "Criou o produto" },
];

export function ProductPreviewModal({
  product,
  open,
  onOpenChange,
}: ProductPreviewModalProps) {
  const [tab, setTab] = useState("preview");

  if (!product) return null;

  const favoritesHistory = generateFavoritesHistory();
  const impressions = Math.floor((product.click_count || 0) / 0.045);
  const ctr = impressions > 0 ? ((product.click_count || 0) / impressions * 100).toFixed(2) : 0;
  const estimatedConversion = ((product.click_count || 0) * 0.023).toFixed(0);

  const getStatusBadge = (status?: string, isPublished?: boolean) => {
    if (!isPublished) {
      return <Badge variant="secondary">Draft</Badge>;
    }
    if (status === "archived") {
      return <Badge variant="outline">Arquivado</Badge>;
    }
    return <Badge className="bg-green-500/10 text-green-500 hover:bg-green-500/20">Publicado</Badge>;
  };

  const getTypeBadge = (type?: string) => {
    switch (type) {
      case "affiliate":
        return <Badge className="bg-blue-500/10 text-blue-500">Afiliado</Badge>;
      case "coupon":
        return <Badge className="bg-purple-500/10 text-purple-500">Cupom</Badge>;
      case "recommendation":
        return <Badge className="bg-amber-500/10 text-amber-500">Recomendação</Badge>;
      default:
        return <Badge variant="secondary">{type}</Badge>;
    }
  };

  const formatPrice = (price?: number, currency?: string) => {
    if (!price) return "—";
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: currency || "BRL",
    }).format(price);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0">
        <DialogHeader className="p-6 pb-0">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              {product.image_url && (
                <img
                  src={product.image_url}
                  alt={product.title}
                  className="w-20 h-20 rounded-lg object-cover"
                />
              )}
              <div>
                <DialogTitle className="text-xl mb-2">{product.title}</DialogTitle>
                <div className="flex items-center gap-2 flex-wrap">
                  {getStatusBadge(product.status, product.is_published)}
                  {getTypeBadge(product.monetization_type)}
                  {product.coupon_code && (
                    <Badge variant="outline" className="gap-1">
                      <Ticket className="h-3 w-3" />
                      {product.coupon_code}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                  <Avatar className="h-5 w-5">
                    <AvatarImage src={product.profiles?.avatar_url} />
                    <AvatarFallback>{product.profiles?.name?.[0]}</AvatarFallback>
                  </Avatar>
                  <span>@{product.profiles?.username}</span>
                  <span>•</span>
                  <span>{product.store || "Sem loja"}</span>
                  <span>•</span>
                  <span>{formatPrice(product.price, product.currency)}</span>
                </div>
              </div>
            </div>
            <Button variant="outline" size="sm" asChild>
              <a href={`/p/${product.slug}`} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-2" />
                Ver no Site
              </a>
            </Button>
          </div>
        </DialogHeader>

        <Tabs value={tab} onValueChange={setTab} className="px-6 pb-6">
          <TabsList className="grid w-full grid-cols-4 mb-4">
            <TabsTrigger value="preview">Preview</TabsTrigger>
            <TabsTrigger value="stats">Estatísticas</TabsTrigger>
            <TabsTrigger value="history">Histórico</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[500px]">
            <TabsContent value="preview" className="mt-0">
              <div className="space-y-4">
                {/* Product Preview */}
                <Card>
                  <CardContent className="p-6">
                    <div className="flex gap-6">
                      {product.image_url && (
                        <img
                          src={product.image_url}
                          alt={product.title}
                          className="w-64 h-64 rounded-lg object-cover"
                        />
                      )}
                      <div className="flex-1 space-y-4">
                        <div>
                          <h3 className="font-semibold text-lg">{product.title}</h3>
                          <p className="text-muted-foreground text-sm mt-1">
                            {product.description || "Sem descrição"}
                          </p>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Preço:</span>
                            <span className="ml-2 font-medium">{formatPrice(product.price, product.currency)}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Loja:</span>
                            <span className="ml-2 font-medium">{product.store || "—"}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Categorias:</span>
                            <span className="ml-2">{product.categories?.join(", ") || "—"}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Slug:</span>
                            <span className="ml-2 font-mono text-xs">{product.slug || "—"}</span>
                          </div>
                        </div>

                        {product.affiliate_url && (
                          <div className="flex items-center gap-2 text-sm">
                            <LinkIcon className="h-4 w-4 text-muted-foreground" />
                            <a 
                              href={product.affiliate_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-primary hover:underline truncate max-w-md"
                            >
                              {product.affiliate_url}
                            </a>
                          </div>
                        )}

                        <div className="flex gap-4 pt-2">
                          <div className="flex items-center gap-2 text-sm">
                            <MousePointerClick className="h-4 w-4 text-muted-foreground" />
                            <span>{product.click_count || 0} clicks</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Heart className="h-4 w-4 text-muted-foreground" />
                            <span>{product.favorite_count || 0} favoritos</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Stats */}
                <div className="grid grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-4 text-center">
                      <Eye className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
                      <div className="text-2xl font-bold">{impressions.toLocaleString()}</div>
                      <div className="text-xs text-muted-foreground">Impressões</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <MousePointerClick className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
                      <div className="text-2xl font-bold">{product.click_count || 0}</div>
                      <div className="text-xs text-muted-foreground">Clicks</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <TrendingUp className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
                      <div className="text-2xl font-bold">{ctr}%</div>
                      <div className="text-xs text-muted-foreground">CTR</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <Heart className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
                      <div className="text-2xl font-bold">{product.favorite_count || 0}</div>
                      <div className="text-xs text-muted-foreground">Favoritos</div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="stats" className="mt-0 space-y-6">
              {/* Favorites Over Time */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Favoritos ao Longo do Tempo</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={favoritesHistory}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
                      <XAxis 
                        dataKey="date" 
                        tick={{ fontSize: 11 }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis 
                        tick={{ fontSize: 11 }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="favoritos"
                        stroke="hsl(var(--primary))"
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <div className="grid grid-cols-2 gap-4">
                {/* Top Referrers */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Top Referrers</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {topReferrers.map((ref, i) => (
                      <div key={i} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>{ref.source}</span>
                          <span className="text-muted-foreground">{ref.visits.toLocaleString()} ({ref.percentage}%)</span>
                        </div>
                        <Progress value={ref.percentage} className="h-1.5" />
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Device Distribution */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Distribuição por Dispositivo</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-center gap-6">
                      <ResponsiveContainer width={120} height={120}>
                        <PieChart>
                          <Pie
                            data={deviceDistribution}
                            dataKey="value"
                            cx="50%"
                            cy="50%"
                            innerRadius={35}
                            outerRadius={50}
                          >
                            {deviceDistribution.map((entry, index) => (
                              <Cell key={index} fill={entry.color} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="space-y-2">
                        {deviceDistribution.map((device, i) => (
                          <div key={i} className="flex items-center gap-2 text-sm">
                            {device.name === "Mobile" && <Smartphone className="h-4 w-4" />}
                            {device.name === "Desktop" && <Monitor className="h-4 w-4" />}
                            {device.name === "Tablet" && <Tablet className="h-4 w-4" />}
                            <span>{device.name}</span>
                            <span className="text-muted-foreground">{device.value}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Conversion Estimate */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Conversão Estimada</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Baseado em taxa média de conversão de 2.3%
                      </p>
                      <p className="text-3xl font-bold mt-1">{estimatedConversion} vendas</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Revenue estimado</p>
                      <p className="text-2xl font-bold text-green-500">
                        {formatPrice((Number(estimatedConversion) * (product.price || 0) * 0.08), product.currency)}
                      </p>
                      <p className="text-xs text-muted-foreground">Comissão 8%</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="history" className="mt-0">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Histórico de Edições</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {editHistory.map((edit, i) => (
                      <div key={i} className="flex gap-4 pb-4 border-b last:border-0">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                            <Edit className="h-4 w-4 text-muted-foreground" />
                          </div>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm">{edit.action}</p>
                          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                            <span>{edit.user}</span>
                            <span>•</span>
                            <span>{edit.date}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="mt-4">
                <CardHeader>
                  <CardTitle className="text-base">Metadados</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">ID:</span>
                      <span className="ml-2 font-mono">{product.id}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Criado em:</span>
                      <span className="ml-2">{format(new Date(product.created_at), "dd/MM/yyyy HH:mm")}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Atualizado em:</span>
                      <span className="ml-2">{format(new Date(product.updated_at), "dd/MM/yyyy HH:mm")}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="reports" className="mt-0">
              <Card>
                <CardContent className="p-6">
                  <div className="text-center py-8">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-500/10 mb-4">
                      <ThumbsUp className="h-6 w-6 text-green-500" />
                    </div>
                    <h3 className="font-semibold mb-1">Nenhum report</h3>
                    <p className="text-sm text-muted-foreground">
                      Este produto não possui denúncias.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="mt-4">
                <CardHeader>
                  <CardTitle className="text-base">Ações de Moderação</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      Marcar como Inapropriado
                    </Button>
                    <Button variant="outline" size="sm">
                      <Star className="h-4 w-4 mr-2" />
                      Destacar na Home
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
