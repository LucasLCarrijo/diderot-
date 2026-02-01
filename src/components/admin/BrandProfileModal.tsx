import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Building2,
  Globe,
  FileText,
  Users,
  TrendingUp,
  Calendar,
  CheckCircle,
  XCircle,
  DollarSign,
  ExternalLink,
  StickyNote,
  Save,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Brand {
  id: number;
  name: string;
  legalName: string;
  cnpj: string;
  logo: string;
  website: string;
  segment: string;
  size: string;
  verified: boolean;
  suspended: boolean;
  totalCampaigns: number;
  activeCampaigns: number;
  totalBudget: number;
  createdAt: Date;
}

interface BrandProfileModalProps {
  brand: Brand | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BrandProfileModal({ brand, open, onOpenChange }: BrandProfileModalProps) {
  if (!brand) return null;

  // Mock campaign history
  const campaignHistory = [
    { id: 1, title: "Lançamento Verão 2024", budget: 50000, creators: 12, status: "completed", roi: 3.5, date: new Date(2024, 0, 15) },
    { id: 2, title: "Black Friday", budget: 80000, creators: 20, status: "completed", roi: 4.2, date: new Date(2023, 10, 20) },
    { id: 3, title: "Dia das Mães", budget: 30000, creators: 8, status: "active", roi: null, date: new Date(2024, 4, 1) },
  ];

  // Mock creators worked with
  const creatorsWorked = [
    { id: 1, name: "Julia Santos", username: "@juliasantos", avatar: "", campaigns: 3, totalEarned: 15000 },
    { id: 2, name: "Pedro Lima", username: "@pedrolima", avatar: "", campaigns: 2, totalEarned: 8000 },
    { id: 3, name: "Ana Costa", username: "@anacosta", avatar: "", campaigns: 2, totalEarned: 12000 },
    { id: 4, name: "Lucas Oliveira", username: "@lucasoliveira", avatar: "", campaigns: 1, totalEarned: 5000 },
  ];

  // Mock documents
  const documents = [
    { name: "Contrato Social", type: "pdf", uploadedAt: new Date(2024, 0, 10), status: "approved" },
    { name: "Comprovante de CNPJ", type: "pdf", uploadedAt: new Date(2024, 0, 10), status: "approved" },
    { name: "Procuração", type: "pdf", uploadedAt: new Date(2024, 0, 11), status: "pending" },
  ];

  const avgROI = campaignHistory.filter(c => c.roi).reduce((acc, c) => acc + (c.roi || 0), 0) / 
    campaignHistory.filter(c => c.roi).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={brand.logo} alt={brand.name} />
              <AvatarFallback>{brand.name.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <span className="flex items-center gap-2">
                {brand.name}
                {brand.verified && (
                  <Badge className="bg-green-500 text-white">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Verificada
                  </Badge>
                )}
                {brand.suspended && (
                  <Badge variant="destructive">Suspensa</Badge>
                )}
              </span>
              <p className="text-sm font-normal text-muted-foreground">{brand.legalName}</p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="info" className="mt-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="info">Informações</TabsTrigger>
            <TabsTrigger value="campaigns">Campanhas</TabsTrigger>
            <TabsTrigger value="creators">Creators</TabsTrigger>
            <TabsTrigger value="documents">Documentos</TabsTrigger>
            <TabsTrigger value="notes">Notas</TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">CNPJ:</span>
                    <span className="font-medium">{brand.cnpj}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Website:</span>
                    <a href={`https://${brand.website}`} target="_blank" rel="noopener noreferrer" 
                       className="font-medium text-primary hover:underline flex items-center gap-1">
                      {brand.website}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Segmento:</span>
                    <span className="font-medium">{brand.segment}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Porte:</span>
                    <span className="font-medium">{brand.size}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Cadastro:</span>
                    <span className="font-medium">
                      {format(brand.createdAt, "dd/MM/yyyy", { locale: ptBR })}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Total de Campanhas</span>
                    <span className="text-xl font-bold">{brand.totalCampaigns}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Campanhas Ativas</span>
                    <span className="text-xl font-bold text-green-500">{brand.activeCampaigns}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Budget Total Gasto</span>
                    <span className="text-xl font-bold">
                      R$ {brand.totalBudget.toLocaleString('pt-BR')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">ROI Médio</span>
                    <span className="text-xl font-bold text-green-500">
                      {avgROI.toFixed(1)}x
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="campaigns" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Histórico de Campanhas</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Campanha</TableHead>
                      <TableHead>Budget</TableHead>
                      <TableHead>Creators</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>ROI</TableHead>
                      <TableHead>Data</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {campaignHistory.map((campaign) => (
                      <TableRow key={campaign.id}>
                        <TableCell className="font-medium">{campaign.title}</TableCell>
                        <TableCell>R$ {campaign.budget.toLocaleString('pt-BR')}</TableCell>
                        <TableCell>{campaign.creators}</TableCell>
                        <TableCell>
                          <Badge variant={campaign.status === "active" ? "default" : "secondary"}>
                            {campaign.status === "active" ? "Ativa" : "Concluída"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {campaign.roi ? (
                            <span className="text-green-500 font-medium">{campaign.roi}x</span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {format(campaign.date, "MMM yyyy", { locale: ptBR })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="creators" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Creators Trabalhados</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {creatorsWorked.map((creator) => (
                    <div key={creator.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={creator.avatar} />
                          <AvatarFallback>{creator.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{creator.name}</p>
                          <p className="text-sm text-muted-foreground">{creator.username}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{creator.campaigns} campanhas</p>
                        <p className="text-sm text-muted-foreground">
                          R$ {creator.totalEarned.toLocaleString('pt-BR')} pagos
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="documents" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Documentos de Verificação</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {documents.map((doc, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <FileText className="h-8 w-8 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{doc.name}</p>
                          <p className="text-sm text-muted-foreground">
                            Enviado em {format(doc.uploadedAt, "dd/MM/yyyy")}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={doc.status === "approved" ? "default" : "secondary"}>
                          {doc.status === "approved" ? "Aprovado" : "Pendente"}
                        </Badge>
                        <Button variant="outline" size="sm">
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notes" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <StickyNote className="h-4 w-4" />
                  Notas Administrativas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="p-3 bg-muted rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">Admin</span>
                      <span className="text-xs text-muted-foreground">10/01/2024</span>
                    </div>
                    <p className="text-sm">Verificação de documentos concluída. CNPJ ativo e regular.</p>
                  </div>
                  <div className="p-3 bg-muted rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">Admin</span>
                      <span className="text-xs text-muted-foreground">15/01/2024</span>
                    </div>
                    <p className="text-sm">Brand aprovada para campanhas de alto budget.</p>
                  </div>
                </div>
                <Separator />
                <div className="space-y-2">
                  <Textarea placeholder="Adicionar nova nota..." className="min-h-[80px]" />
                  <Button size="sm">
                    <Save className="h-4 w-4 mr-2" />
                    Salvar Nota
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Separator className="my-4" />

        <div className="flex justify-between">
          <div className="flex gap-2">
            {!brand.verified && (
              <Button className="bg-green-500 hover:bg-green-600">
                <CheckCircle className="h-4 w-4 mr-2" />
                Verificar Brand
              </Button>
            )}
            {brand.suspended ? (
              <Button variant="outline">
                <CheckCircle className="h-4 w-4 mr-2" />
                Reativar Brand
              </Button>
            ) : (
              <Button variant="destructive">
                <XCircle className="h-4 w-4 mr-2" />
                Suspender Brand
              </Button>
            )}
          </div>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
