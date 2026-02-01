import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Eye, Heart, MousePointerClick, ExternalLink, MapPin, 
  Clock, TrendingUp, AlertTriangle, Hash
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

interface PostData {
  id: string;
  image_url: string;
  title?: string;
  content?: string;
  creator: {
    name: string;
    username: string;
    avatar: string;
  };
  pins: Array<{
    id: string;
    x: number;
    y: number;
    product: {
      id: string;
      title: string;
      image_url: string;
      store: string;
      clicks: number;
    };
  }>;
  views: number;
  saves: number;
  clicks: number;
  engagement_rate: number;
  created_at: string;
  hashtags: string[];
  reports: number;
}

interface PostPreviewModalProps {
  post: PostData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PostPreviewModal({ post, open, onOpenChange }: PostPreviewModalProps) {
  if (!post) return null;

  // Mock data for charts
  const viewsOverTime = [
    { date: "Seg", views: Math.floor(Math.random() * 500) + 100 },
    { date: "Ter", views: Math.floor(Math.random() * 500) + 100 },
    { date: "Qua", views: Math.floor(Math.random() * 500) + 100 },
    { date: "Qui", views: Math.floor(Math.random() * 500) + 100 },
    { date: "Sex", views: Math.floor(Math.random() * 500) + 100 },
    { date: "Sáb", views: Math.floor(Math.random() * 500) + 100 },
    { date: "Dom", views: Math.floor(Math.random() * 500) + 100 },
  ];

  const engagementByHour = [
    { hour: "9h", engagement: 45 },
    { hour: "12h", engagement: 78 },
    { hour: "15h", engagement: 62 },
    { hour: "18h", engagement: 95 },
    { hour: "21h", engagement: 88 },
    { hour: "00h", engagement: 35 },
  ];

  const deviceData = [
    { name: "Mobile", value: 68, color: "hsl(var(--primary))" },
    { name: "Desktop", value: 25, color: "hsl(var(--muted-foreground))" },
    { name: "Tablet", value: 7, color: "hsl(var(--secondary))" },
  ];

  // Mock click heatmap data for pins
  const pinClicks = post.pins.map(pin => ({
    ...pin,
    clickPercentage: Math.floor(Math.random() * 60) + 10,
  }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={post.creator.avatar} />
              <AvatarFallback>{post.creator.name[0]}</AvatarFallback>
            </Avatar>
            <div>
              <span>Post de @{post.creator.username}</span>
              <span className="text-sm font-normal text-muted-foreground ml-2">
                {format(new Date(post.created_at), "dd MMM yyyy", { locale: ptBR })}
              </span>
            </div>
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="preview" className="mt-4">
          <TabsList>
            <TabsTrigger value="preview">Preview</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="products">Produtos ({post.pins.length})</TabsTrigger>
            {post.reports > 0 && (
              <TabsTrigger value="reports" className="text-destructive">
                Reports ({post.reports})
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="preview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Image with Interactive Pins */}
              <div className="relative">
                <img
                  src={post.image_url}
                  alt=""
                  className="w-full rounded-lg"
                />
                {/* Pin markers */}
                {post.pins.map((pin, idx) => (
                  <div
                    key={pin.id}
                    className="absolute w-8 h-8 -translate-x-1/2 -translate-y-1/2 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold shadow-lg cursor-pointer hover:scale-110 transition-transform"
                    style={{ left: `${pin.x * 100}%`, top: `${pin.y * 100}%` }}
                    title={pin.product.title}
                  >
                    {idx + 1}
                  </div>
                ))}
              </div>

              {/* Caption and Info */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={post.creator.avatar} />
                    <AvatarFallback>{post.creator.name[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{post.creator.name}</p>
                    <p className="text-sm text-muted-foreground">@{post.creator.username}</p>
                  </div>
                </div>

                <div className="text-sm leading-relaxed">
                  {post.content}
                  <div className="flex flex-wrap gap-1 mt-2">
                    {post.hashtags.map(tag => (
                      <Badge key={tag} variant="secondary" className="gap-1">
                        <Hash className="h-3 w-3" />
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 py-4 border-y">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-muted-foreground">
                      <Eye className="h-4 w-4" />
                    </div>
                    <p className="text-xl font-bold">{post.views.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">Views</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-muted-foreground">
                      <Heart className="h-4 w-4" />
                    </div>
                    <p className="text-xl font-bold">{post.saves.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">Saves</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-muted-foreground">
                      <MousePointerClick className="h-4 w-4" />
                    </div>
                    <p className="text-xl font-bold">{post.clicks.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">Clicks</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  {post.pins.length} pins marcados
                </div>

                <Button className="w-full" variant="outline" asChild>
                  <a href={`/posts/${post.id}`} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Ver no Site
                  </a>
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold">{post.views.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">Impressões</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold">{post.engagement_rate.toFixed(1)}%</p>
                  <p className="text-sm text-muted-foreground">Engagement Rate</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold">{((post.clicks / post.views) * 100).toFixed(1)}%</p>
                  <p className="text-sm text-muted-foreground">CTR</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold">{(post.saves / post.views * 100).toFixed(1)}%</p>
                  <p className="text-sm text-muted-foreground">Save Rate</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Views Over Time */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Views ao longo do tempo</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={viewsOverTime}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="date" className="text-xs" />
                        <YAxis className="text-xs" />
                        <Tooltip />
                        <Line 
                          type="monotone" 
                          dataKey="views" 
                          stroke="hsl(var(--primary))" 
                          strokeWidth={2}
                          dot={{ r: 4 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Pin Click Heatmap */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Distribuição de Clicks por Pin</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {pinClicks.map((pin, idx) => (
                      <div key={pin.id} className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                          {idx + 1}
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between text-sm mb-1">
                            <span className="truncate max-w-[150px]">{pin.product.title}</span>
                            <span className="font-medium">{pin.clickPercentage}%</span>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-primary transition-all"
                              style={{ width: `${pin.clickPercentage}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Top Engagement Hours */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Top Horários de Engajamento
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {engagementByHour.sort((a, b) => b.engagement - a.engagement).slice(0, 4).map((item) => (
                      <div key={item.hour} className="flex items-center gap-3">
                        <span className="text-sm font-medium w-10">{item.hour}</span>
                        <div className="flex-1 h-4 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary transition-all"
                            style={{ width: `${item.engagement}%` }}
                          />
                        </div>
                        <span className="text-sm text-muted-foreground w-12">{item.engagement}%</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Device Distribution */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Distribuição por Dispositivo</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[150px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={deviceData}
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={60}
                          dataKey="value"
                          label={({ name, value }) => `${name}: ${value}%`}
                        >
                          {deviceData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="products" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {post.pins.map((pin, idx) => (
                <Card key={pin.id} className="flex gap-4 p-4">
                  <div className="relative">
                    <img 
                      src={pin.product.image_url} 
                      alt="" 
                      className="w-20 h-20 rounded-lg object-cover"
                    />
                    <div className="absolute -top-2 -left-2 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">
                      {idx + 1}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{pin.product.title}</p>
                    <p className="text-sm text-muted-foreground">{pin.product.store}</p>
                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <MousePointerClick className="h-3.5 w-3.5" />
                        {pin.product.clicks} clicks
                      </span>
                      <span className="text-xs">
                        Posição: ({(pin.x * 100).toFixed(0)}%, {(pin.y * 100).toFixed(0)}%)
                      </span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          {post.reports > 0 && (
            <TabsContent value="reports" className="space-y-4">
              <Card className="border-destructive/50 bg-destructive/5">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
                    <div>
                      <p className="font-medium">Este post recebeu {post.reports} denúncia(s)</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Revise o conteúdo e tome as ações necessárias
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-3">
                {[...Array(post.reports)].map((_, i) => (
                  <Card key={i}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <Badge variant="outline" className="mb-2">
                            {["Conteúdo inapropriado", "Spam", "Informação falsa"][i % 3]}
                          </Badge>
                          <p className="text-sm text-muted-foreground">
                            Reportado há {Math.floor(Math.random() * 7) + 1} dias
                          </p>
                        </div>
                        <Badge variant="secondary">Pendente</Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          )}
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
