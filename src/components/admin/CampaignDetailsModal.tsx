import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Building2,
  Calendar,
  DollarSign,
  Users,
  Target,
  FileText,
  Image,
  CheckCircle,
  Clock,
  XCircle,
  TrendingUp,
  Eye,
  MousePointer,
  ShoppingCart,
  MessageSquare,
  Send,
  ExternalLink,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from "recharts";

interface Campaign {
  id: number;
  title: string;
  brandName: string;
  brandLogo: string;
  status: string;
  budget: number;
  startDate: Date;
  endDate: Date;
  creatorsApplied: number;
  creatorsApproved: number;
  deliverablesCompleted: number;
  deliverablesTotal: number;
  impressions: number;
  clicks: number;
  conversions: number;
  roi: number;
}

interface CampaignDetailsModalProps {
  campaign: Campaign | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const performanceData = [
  { date: "Sem 1", impressions: 15000, clicks: 450, conversions: 12 },
  { date: "Sem 2", impressions: 28000, clicks: 890, conversions: 25 },
  { date: "Sem 3", impressions: 42000, clicks: 1250, conversions: 38 },
  { date: "Sem 4", impressions: 55000, clicks: 1600, conversions: 52 },
];

const COLORS = ["#22c55e", "#eab308", "#ef4444"];

export function CampaignDetailsModal({ campaign, open, onOpenChange }: CampaignDetailsModalProps) {
  if (!campaign) return null;

  // Mock applications
  const applications = [
    { id: 1, name: "Julia Santos", username: "@juliasantos", avatar: "", followers: 45000, engagement: 4.5, fee: 3000, status: "approved" },
    { id: 2, name: "Pedro Lima", username: "@pedrolima", avatar: "", followers: 32000, engagement: 5.2, fee: 2500, status: "approved" },
    { id: 3, name: "Ana Costa", username: "@anacosta", avatar: "", followers: 68000, engagement: 3.8, fee: 4000, status: "pending" },
    { id: 4, name: "Lucas Oliveira", username: "@lucasoliveira", avatar: "", followers: 22000, engagement: 6.1, fee: 2000, status: "rejected" },
  ];

  // Mock deliverables
  const deliverables = [
    { id: 1, creator: "Julia Santos", type: "Post com Pins", dueDate: new Date(2024, 5, 15), status: "completed", link: "#" },
    { id: 2, creator: "Julia Santos", type: "Story", dueDate: new Date(2024, 5, 16), status: "completed", link: "#" },
    { id: 3, creator: "Pedro Lima", type: "Post com Pins", dueDate: new Date(2024, 5, 18), status: "pending", link: null },
    { id: 4, creator: "Pedro Lima", type: "Coleção", dueDate: new Date(2024, 5, 20), status: "pending", link: null },
  ];

  // Mock chat messages
  const chatMessages = [
    { id: 1, sender: "Brand", message: "Olá! Gostaríamos de discutir os detalhes da campanha.", time: "10:30" },
    { id: 2, sender: "Julia Santos", message: "Claro! Estou disponível para alinharmos os pontos.", time: "10:45" },
    { id: 3, sender: "Brand", message: "Os assets foram enviados no briefing. Podemos começar amanhã?", time: "11:00" },
    { id: 4, sender: "Julia Santos", message: "Perfeito! Vou preparar o conteúdo e enviar para aprovação.", time: "11:15" },
  ];

  const channelData = [
    { name: "Aprovados", value: campaign.creatorsApproved },
    { name: "Pendentes", value: applications.filter(a => a.status === "pending").length },
    { name: "Rejeitados", value: applications.filter(a => a.status === "rejected").length },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={campaign.brandLogo} alt={campaign.brandName} />
                <AvatarFallback>{campaign.brandName.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div>
                <span>{campaign.title}</span>
                <p className="text-sm font-normal text-muted-foreground">{campaign.brandName}</p>
              </div>
            </div>
            <Badge className={
              campaign.status === "active" ? "bg-green-500" :
              campaign.status === "completed" ? "bg-blue-500" :
              campaign.status === "paused" ? "bg-yellow-500" : "bg-muted"
            }>
              {campaign.status === "active" ? "Ativa" :
               campaign.status === "completed" ? "Concluída" :
               campaign.status === "paused" ? "Pausada" : "Draft"}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="info" className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="info">Info</TabsTrigger>
            <TabsTrigger value="applications">Aplicações</TabsTrigger>
            <TabsTrigger value="deliverables">Deliverables</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="chat">Chat</TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1 mt-4">
            <TabsContent value="info" className="space-y-4 m-0">
              {/* Campaign Overview */}
              <div className="grid grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4 text-center">
                    <DollarSign className="h-6 w-6 mx-auto mb-2 text-green-500" />
                    <p className="text-2xl font-bold">R$ {(campaign.budget / 1000).toFixed(0)}K</p>
                    <p className="text-sm text-muted-foreground">Budget</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <Calendar className="h-6 w-6 mx-auto mb-2 text-blue-500" />
                    <p className="text-sm font-medium">
                      {format(campaign.startDate, "dd/MM")} → {format(campaign.endDate, "dd/MM")}
                    </p>
                    <p className="text-sm text-muted-foreground">Período</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <Users className="h-6 w-6 mx-auto mb-2 text-purple-500" />
                    <p className="text-2xl font-bold">{campaign.creatorsApproved}</p>
                    <p className="text-sm text-muted-foreground">Creators Aprovados</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <TrendingUp className="h-6 w-6 mx-auto mb-2 text-green-500" />
                    <p className="text-2xl font-bold">{campaign.roi}x</p>
                    <p className="text-sm text-muted-foreground">ROI</p>
                  </CardContent>
                </Card>
              </div>

              {/* Briefing */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Briefing
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Objetivo</h4>
                    <p className="text-sm text-muted-foreground">
                      Aumentar o awareness da nova coleção de verão através de conteúdo autêntico criado por influenciadores.
                      Meta: alcançar 500K impressões e gerar 2.000 cliques para o e-commerce.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Requisitos</h4>
                    <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                      <li>Mínimo 10K followers</li>
                      <li>Engagement rate &gt; 3%</li>
                      <li>Conteúdo original (não repost)</li>
                      <li>Mencionar hashtag #NovaColecao2024</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Deliverables Esperados</h4>
                    <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                      <li>1 Post com pins de produtos</li>
                      <li>3 Stories com link</li>
                      <li>1 Coleção com no mínimo 5 produtos</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>

              {/* Assets */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Image className="h-4 w-4" />
                    Assets Disponíveis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="aspect-square bg-muted rounded-lg flex items-center justify-center">
                        <Image className="h-8 w-8 text-muted-foreground" />
                      </div>
                    ))}
                  </div>
                  <Button variant="outline" size="sm" className="mt-4">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Ver todos os assets
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="applications" className="m-0">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">Aplicações ({applications.length})</CardTitle>
                    <div className="flex gap-2">
                      <Badge variant="outline" className="bg-green-50 text-green-700">
                        {applications.filter(a => a.status === "approved").length} Aprovados
                      </Badge>
                      <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
                        {applications.filter(a => a.status === "pending").length} Pendentes
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Creator</TableHead>
                        <TableHead>Followers</TableHead>
                        <TableHead>Engagement</TableHead>
                        <TableHead>Fee Solicitado</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {applications.map((app) => (
                        <TableRow key={app.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={app.avatar} />
                                <AvatarFallback>{app.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">{app.name}</p>
                                <p className="text-sm text-muted-foreground">{app.username}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{(app.followers / 1000).toFixed(1)}K</TableCell>
                          <TableCell>{app.engagement}%</TableCell>
                          <TableCell>R$ {app.fee.toLocaleString('pt-BR')}</TableCell>
                          <TableCell>
                            <Badge className={
                              app.status === "approved" ? "bg-green-500" :
                              app.status === "pending" ? "bg-yellow-500" : "bg-red-500"
                            }>
                              {app.status === "approved" ? "Aprovado" :
                               app.status === "pending" ? "Pendente" : "Rejeitado"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="sm">Ver</Button>
                              {app.status === "pending" && (
                                <>
                                  <Button variant="ghost" size="sm" className="text-green-500">
                                    <CheckCircle className="h-4 w-4" />
                                  </Button>
                                  <Button variant="ghost" size="sm" className="text-red-500">
                                    <XCircle className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="deliverables" className="m-0">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">
                      Deliverables ({campaign.deliverablesCompleted}/{campaign.deliverablesTotal})
                    </CardTitle>
                    <Progress value={(campaign.deliverablesCompleted / campaign.deliverablesTotal) * 100} className="w-32" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {deliverables.map((del) => (
                      <div key={del.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Checkbox checked={del.status === "completed"} />
                          <div>
                            <p className="font-medium">{del.type}</p>
                            <p className="text-sm text-muted-foreground">{del.creator}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-sm">Prazo: {format(del.dueDate, "dd/MM")}</p>
                            <Badge variant={del.status === "completed" ? "default" : "secondary"}>
                              {del.status === "completed" ? "Entregue" : "Pendente"}
                            </Badge>
                          </div>
                          {del.link && (
                            <Button variant="outline" size="sm">
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="performance" className="space-y-4 m-0">
              {/* Metrics */}
              <div className="grid grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4 text-center">
                    <Eye className="h-5 w-5 mx-auto mb-1 text-blue-500" />
                    <p className="text-xl font-bold">{(campaign.impressions / 1000).toFixed(0)}K</p>
                    <p className="text-xs text-muted-foreground">Impressões</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <MousePointer className="h-5 w-5 mx-auto mb-1 text-green-500" />
                    <p className="text-xl font-bold">{campaign.clicks.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">Clicks</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <ShoppingCart className="h-5 w-5 mx-auto mb-1 text-purple-500" />
                    <p className="text-xl font-bold">{campaign.conversions}</p>
                    <p className="text-xs text-muted-foreground">Conversões</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <Target className="h-5 w-5 mx-auto mb-1 text-orange-500" />
                    <p className="text-xl font-bold">
                      {((campaign.clicks / campaign.impressions) * 100).toFixed(2)}%
                    </p>
                    <p className="text-xs text-muted-foreground">CTR</p>
                  </CardContent>
                </Card>
              </div>

              {/* Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Performance ao Longo do Tempo</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={performanceData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                      <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--background))', 
                          border: '1px solid hsl(var(--border))' 
                        }}
                      />
                      <Line type="monotone" dataKey="impressions" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} name="Impressões" />
                      <Line type="monotone" dataKey="clicks" stroke="#22c55e" strokeWidth={2} dot={{ r: 4 }} name="Clicks" />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Status das Aplicações</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie
                          data={channelData}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={80}
                          dataKey="value"
                          label={({ name, value }) => `${name}: ${value}`}
                        >
                          {channelData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Clicks por Semana</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={performanceData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                        <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                        <Tooltip />
                        <Bar dataKey="clicks" fill="#22c55e" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="chat" className="m-0">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Histórico de Mensagens
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 mb-4">
                    {chatMessages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.sender === "Brand" ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[70%] p-3 rounded-lg ${
                            msg.sender === "Brand"
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted"
                          }`}
                        >
                          <p className="text-xs font-medium mb-1">{msg.sender}</p>
                          <p className="text-sm">{msg.message}</p>
                          <p className="text-xs opacity-70 mt-1">{msg.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Digite uma mensagem..."
                      className="flex-1 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <Button size="sm">
                      <Send className="h-4 w-4" />
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
