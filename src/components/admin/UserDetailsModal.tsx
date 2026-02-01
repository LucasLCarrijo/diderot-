import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Edit,
  Ban,
  Mail,
  ExternalLink,
  CheckCircle2,
  MapPin,
  Phone,
  Calendar,
  Clock,
  Monitor,
  Globe,
  Package,
  FileImage,
  Folder,
  MousePointerClick,
  Heart,
  Users,
  CreditCard,
  AlertTriangle,
  Shield,
  FileText,
  Plus,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
} from "recharts";

interface User {
  id: string;
  name: string;
  email: string;
  handle: string;
  avatar: string;
  role: "follower" | "creator" | "brand" | "admin";
  status: "active" | "inactive" | "suspended" | "banned";
  plan: "free" | "pro" | "brand";
  verified: boolean;
  createdAt: Date;
  lastAccess: Date;
}

interface UserDetailsModalProps {
  user: User | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Mock data generators
const generateClicksData = () => {
  return Array.from({ length: 30 }, (_, i) => ({
    day: format(new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000), "dd/MM"),
    clicks: Math.floor(Math.random() * 500) + 50,
  }));
};

const mockPaymentHistory = [
  { id: "1", date: new Date(2024, 11, 1), amount: 49.9, status: "paid", method: "Cartão •••• 4242" },
  { id: "2", date: new Date(2024, 10, 1), amount: 49.9, status: "paid", method: "Cartão •••• 4242" },
  { id: "3", date: new Date(2024, 9, 1), amount: 49.9, status: "paid", method: "Cartão •••• 4242" },
  { id: "4", date: new Date(2024, 8, 1), amount: 49.9, status: "paid", method: "Cartão •••• 4242" },
  { id: "5", date: new Date(2024, 7, 1), amount: 49.9, status: "paid", method: "Cartão •••• 4242" },
];

const mockReports = [
  { id: "1", date: new Date(2024, 11, 15), reason: "Spam", reporter: "user123", status: "reviewed" },
  { id: "2", date: new Date(2024, 10, 20), reason: "Conteúdo inapropriado", reporter: "user456", status: "dismissed" },
];

const mockWarnings = [
  { id: "1", date: new Date(2024, 11, 10), reason: "Violação de termos", admin: "Admin João" },
];

const mockAuditLogs = [
  { id: "1", date: new Date(2024, 11, 20), action: "Editou perfil", details: "Alterou bio e avatar", admin: null },
  { id: "2", date: new Date(2024, 11, 15), action: "Upgrade para Pro", details: "Assinatura iniciada", admin: null },
  { id: "3", date: new Date(2024, 11, 10), action: "Warning recebido", details: "Violação de termos", admin: "Admin João" },
  { id: "4", date: new Date(2024, 10, 5), action: "Role alterada", details: "Follower → Creator", admin: null },
  { id: "5", date: new Date(2024, 9, 1), action: "Cadastro realizado", details: "Origem: organic", admin: null },
];

const getRoleBadgeVariant = (role: string) => {
  switch (role) {
    case "admin": return "destructive";
    case "creator": return "default";
    case "brand": return "secondary";
    default: return "outline";
  }
};

const getStatusBadgeVariant = (status: string) => {
  switch (status) {
    case "active": return "default";
    case "inactive": return "secondary";
    case "suspended": return "outline";
    case "banned": return "destructive";
    default: return "outline";
  }
};

const getPlanBadgeVariant = (plan: string) => {
  switch (plan) {
    case "pro": return "default";
    case "brand": return "secondary";
    default: return "outline";
  }
};

export function UserDetailsModal({ user, open, onOpenChange }: UserDetailsModalProps) {
  const [adminNotes, setAdminNotes] = useState("Usuário em boa situação. Nenhuma irregularidade detectada.");
  const clicksData = generateClicksData();

  if (!user) return null;

  const isCreator = user.role === "creator" || user.role === "brand";
  const hasPaidPlan = user.plan === "pro" || user.plan === "brand";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0">
        <ScrollArea className="max-h-[90vh]">
          <div className="p-6">
            {/* Header */}
            <DialogHeader className="mb-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={user.avatar} alt={user.name} />
                    <AvatarFallback className="text-2xl">
                      {user.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <DialogTitle className="text-xl font-semibold">{user.name}</DialogTitle>
                    <p className="text-muted-foreground">@{user.handle}</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <Badge variant={getRoleBadgeVariant(user.role)} className="capitalize">
                        {user.role}
                      </Badge>
                      <Badge variant={getPlanBadgeVariant(user.plan)} className="capitalize">
                        {user.plan === "free" ? "Free" : user.plan === "pro" ? "Creator Pro" : "Brand"}
                      </Badge>
                      {user.verified && (
                        <Badge variant="default" className="bg-blue-500">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Verificado
                        </Badge>
                      )}
                      <Badge variant={getStatusBadgeVariant(user.status)} className="capitalize">
                        {user.status === "active" ? "Ativo" : 
                         user.status === "inactive" ? "Inativo" :
                         user.status === "suspended" ? "Suspenso" : "Banido"}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="outline" size="icon">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Editar</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="outline" size="icon">
                          <Ban className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Suspender</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="outline" size="icon">
                          <Mail className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Enviar Email</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="outline" size="icon">
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Ver no Site</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
            </DialogHeader>

            {/* Tabs */}
            <Tabs defaultValue="info" className="w-full">
              <TabsList className="grid w-full grid-cols-5 mb-6">
                <TabsTrigger value="info">Informações</TabsTrigger>
                <TabsTrigger value="activity">Atividade</TabsTrigger>
                <TabsTrigger value="financial" disabled={!hasPaidPlan}>
                  Financeiro
                </TabsTrigger>
                <TabsTrigger value="moderation">Moderação</TabsTrigger>
                <TabsTrigger value="audit">Auditoria</TabsTrigger>
              </TabsList>

              {/* Tab 1: Informações Gerais */}
              <TabsContent value="info" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium">Contato</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span>{user.email}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span>+55 11 99999-9999</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span>São Paulo, SP, Brasil</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium">Datas</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>Cadastro: {format(user.createdAt, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>Último acesso: {formatDistanceToNow(user.lastAccess, { addSuffix: true, locale: ptBR })}</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium">Técnico</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center gap-2 text-sm">
                        <Globe className="h-4 w-4 text-muted-foreground" />
                        <span>IP: 189.103.xxx.xxx</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Monitor className="h-4 w-4 text-muted-foreground" />
                        <span>Dispositivo: iPhone 15 Pro (iOS 17)</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium">Aquisição</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center gap-2 text-sm">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span>Fonte: <Badge variant="outline">Referral</Badge></span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        Indicado por: @maria_style
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Tab 2: Atividade */}
              <TabsContent value="activity" className="space-y-4">
                {isCreator ? (
                  <>
                    <div className="grid grid-cols-3 gap-4">
                      <Card>
                        <CardContent className="pt-6">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-lg">
                              <Package className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <p className="text-2xl font-bold">47</p>
                              <p className="text-sm text-muted-foreground">Produtos</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="pt-6">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-lg">
                              <FileImage className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <p className="text-2xl font-bold">23</p>
                              <p className="text-sm text-muted-foreground">Posts</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="pt-6">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-lg">
                              <Folder className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <p className="text-2xl font-bold">5</p>
                              <p className="text-sm text-muted-foreground">Coleções</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="pt-6">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-green-500/10 rounded-lg">
                              <MousePointerClick className="h-5 w-5 text-green-500" />
                            </div>
                            <div>
                              <p className="text-2xl font-bold">12.4K</p>
                              <p className="text-sm text-muted-foreground">Clicks</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="pt-6">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-red-500/10 rounded-lg">
                              <Heart className="h-5 w-5 text-red-500" />
                            </div>
                            <div>
                              <p className="text-2xl font-bold">3.2K</p>
                              <p className="text-sm text-muted-foreground">Favoritos</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="pt-6">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-500/10 rounded-lg">
                              <Users className="h-5 w-5 text-blue-500" />
                            </div>
                            <div>
                              <p className="text-2xl font-bold">1.8K</p>
                              <p className="text-sm text-muted-foreground">Followers</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm font-medium">Clicks nos Últimos 30 Dias</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="h-[200px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={clicksData}>
                              <defs>
                                <linearGradient id="clicksGradient" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                              <XAxis dataKey="day" fontSize={12} tickLine={false} axisLine={false} />
                              <YAxis fontSize={12} tickLine={false} axisLine={false} />
                              <RechartsTooltip 
                                contentStyle={{ 
                                  backgroundColor: "hsl(var(--background))", 
                                  border: "1px solid hsl(var(--border))",
                                  borderRadius: "8px"
                                }} 
                              />
                              <Area
                                type="monotone"
                                dataKey="clicks"
                                stroke="hsl(var(--primary))"
                                fill="url(#clicksGradient)"
                                strokeWidth={2}
                              />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>
                  </>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-red-500/10 rounded-lg">
                            <Heart className="h-5 w-5 text-red-500" />
                          </div>
                          <div>
                            <p className="text-2xl font-bold">156</p>
                            <p className="text-sm text-muted-foreground">Produtos Favoritados</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-primary/10 rounded-lg">
                            <Folder className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="text-2xl font-bold">8</p>
                            <p className="text-sm text-muted-foreground">Coleções Criadas</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-500/10 rounded-lg">
                            <Users className="h-5 w-5 text-blue-500" />
                          </div>
                          <div>
                            <p className="text-2xl font-bold">24</p>
                            <p className="text-sm text-muted-foreground">Creators Seguidos</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-green-500/10 rounded-lg">
                            <MousePointerClick className="h-5 w-5 text-green-500" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">Último Click</p>
                            <p className="text-sm text-muted-foreground">Nike Air Max 90 - há 2h</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </TabsContent>

              {/* Tab 3: Histórico Financeiro */}
              <TabsContent value="financial" className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium">Status da Assinatura</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Badge variant="default" className="bg-green-500">Ativa</Badge>
                      <p className="text-sm text-muted-foreground mt-2">Creator Pro - Mensal</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium">Próximo Pagamento</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold">R$ 49,90</p>
                      <p className="text-sm text-muted-foreground">em 15/01/2025</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium">Total Gasto</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold">R$ 249,50</p>
                      <p className="text-sm text-muted-foreground">5 pagamentos</p>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      Método de Pagamento
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">Cartão de Crédito •••• 4242</p>
                    <p className="text-sm text-muted-foreground">Expira em 12/2026</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium">Histórico de Pagamentos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Data</TableHead>
                          <TableHead>Valor</TableHead>
                          <TableHead>Método</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {mockPaymentHistory.map((payment) => (
                          <TableRow key={payment.id}>
                            <TableCell>{format(payment.date, "dd/MM/yyyy")}</TableCell>
                            <TableCell>R$ {payment.amount.toFixed(2)}</TableCell>
                            <TableCell>{payment.method}</TableCell>
                            <TableCell>
                              <Badge variant="default" className="bg-green-500">Pago</Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>

                <Button variant="destructive" className="w-full">
                  <Ban className="h-4 w-4 mr-2" />
                  Cancelar Assinatura
                </Button>
              </TabsContent>

              {/* Tab 4: Moderação */}
              <TabsContent value="moderation" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      Reports Recebidos ({mockReports.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Data</TableHead>
                          <TableHead>Motivo</TableHead>
                          <TableHead>Reportado por</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {mockReports.map((report) => (
                          <TableRow key={report.id}>
                            <TableCell>{format(report.date, "dd/MM/yyyy")}</TableCell>
                            <TableCell>{report.reason}</TableCell>
                            <TableCell>@{report.reporter}</TableCell>
                            <TableCell>
                              <Badge variant={report.status === "reviewed" ? "secondary" : "outline"}>
                                {report.status === "reviewed" ? "Analisado" : "Dispensado"}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      Warnings Dados ({mockWarnings.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {mockWarnings.length > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Data</TableHead>
                            <TableHead>Motivo</TableHead>
                            <TableHead>Admin</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {mockWarnings.map((warning) => (
                            <TableRow key={warning.id}>
                              <TableCell>{format(warning.date, "dd/MM/yyyy")}</TableCell>
                              <TableCell>{warning.reason}</TableCell>
                              <TableCell>{warning.admin}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <p className="text-sm text-muted-foreground">Nenhum warning registrado</p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Notas Administrativas
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Textarea
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      placeholder="Adicione notas sobre este usuário..."
                      rows={4}
                    />
                    <Button size="sm">Salvar Notas</Button>
                  </CardContent>
                </Card>

                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1">
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Warning
                  </Button>
                  <Button variant="outline" className="flex-1">
                    <Ban className="h-4 w-4 mr-2" />
                    Suspender
                  </Button>
                  <Button variant="destructive" className="flex-1">
                    <Ban className="h-4 w-4 mr-2" />
                    Banir
                  </Button>
                </div>
              </TabsContent>

              {/* Tab 5: Logs de Auditoria */}
              <TabsContent value="audit" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium">Timeline de Ações</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="relative">
                      <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />
                      <div className="space-y-6">
                        {mockAuditLogs.map((log, index) => (
                          <div key={log.id} className="relative pl-10">
                            <div className="absolute left-2.5 w-3 h-3 rounded-full bg-primary border-2 border-background" />
                            <div className="bg-muted/50 rounded-lg p-4">
                              <div className="flex items-start justify-between">
                                <div>
                                  <p className="font-medium text-sm">{log.action}</p>
                                  <p className="text-sm text-muted-foreground">{log.details}</p>
                                </div>
                                <div className="text-right">
                                  <p className="text-xs text-muted-foreground">
                                    {format(log.date, "dd/MM/yyyy 'às' HH:mm")}
                                  </p>
                                  {log.admin && (
                                    <p className="text-xs text-muted-foreground">por {log.admin}</p>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
