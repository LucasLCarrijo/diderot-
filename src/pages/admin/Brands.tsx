import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { BrandProfileModal } from "@/components/admin/BrandProfileModal";
import { CampaignDetailsModal } from "@/components/admin/CampaignDetailsModal";
import {
  useBrands,
  useCampaigns,
  useCampaignApplications,
  useCampaignHistory,
  useUpdateBrandStatus,
  useUpdateApplicationStatus,
  type Brand,
  type Campaign,
} from "@/hooks/useBrands";
import {
  Building2,
  Megaphone,
  Users,
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  Search,
  MoreHorizontal,
  Eye,
  ShieldCheck,
  Ban,
  ChevronDown,
  ChevronUp,
  Calendar,
  Target,
  FileText,
  ArrowUpRight,
  History,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const SEGMENTS = ["Moda", "Beleza", "Tecnologia", "Esportes", "Alimentação", "Casa", "Automotivo", "Viagens"];
const SIZES = ["MEI", "Pequena", "Média", "Grande"];

export default function AdminBrands() {
  // Data hooks
  const { data: brands = [], isLoading: brandsLoading } = useBrands();
  const { data: campaigns = [], isLoading: campaignsLoading } = useCampaigns();
  const { data: applications = [], isLoading: applicationsLoading } = useCampaignApplications("pending");
  const { data: history = [], isLoading: historyLoading } = useCampaignHistory();
  
  // Mutations
  const updateBrandStatus = useUpdateBrandStatus();
  const updateApplicationStatus = useUpdateApplicationStatus();

  // Brands tab state
  const [brandSearch, setBrandSearch] = useState("");
  const [brandStatus, setBrandStatus] = useState("all");
  const [brandSegment, setBrandSegment] = useState("all");
  const [brandSize, setBrandSize] = useState("all");
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);
  const [brandModalOpen, setBrandModalOpen] = useState(false);

  // Campaigns tab state
  const [expandedCampaign, setExpandedCampaign] = useState<string | null>(null);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [campaignModalOpen, setCampaignModalOpen] = useState(false);

  // History tab state
  const [historyType, setHistoryType] = useState("all");

  // Filter brands
  const filteredBrands = useMemo(() => {
    return brands.filter(brand => {
      const matchesSearch = brand.company_name.toLowerCase().includes(brandSearch.toLowerCase()) ||
        brand.cnpj.includes(brandSearch);
      const matchesStatus = brandStatus === "all" ||
        (brandStatus === "verified" && brand.status === "verified") ||
        (brandStatus === "pending" && brand.status === "pending") ||
        (brandStatus === "suspended" && brand.status === "suspended");
      const matchesSegment = brandSegment === "all" || brand.segment === brandSegment;
      const matchesSize = brandSize === "all" || brand.company_size === brandSize;
      return matchesSearch && matchesStatus && matchesSegment && matchesSize;
    });
  }, [brands, brandSearch, brandStatus, brandSegment, brandSize]);

  // Active campaigns
  const activeCampaigns = useMemo(() => 
    campaigns.filter(c => c.status === "active" || c.status === "paused"),
    [campaigns]
  );

  // Calculate metrics
  const totalBrands = brands.length;
  const verifiedBrands = brands.filter(b => b.status === "verified").length;
  const activeCampaignsCount = campaigns.filter(c => c.status === "active").length;
  const totalBudget = campaigns.filter(c => c.status === "active").reduce((acc, c) => acc + (c.budget || 0), 0);
  const totalCreatorsWorking = activeCampaigns.reduce((acc, c) => acc + (c.creators_approved || 0), 0);
  const avgROI = activeCampaigns.length > 0 
    ? activeCampaigns.reduce((acc, c) => acc + (c.clicks > 0 ? c.conversions / c.clicks * 10 : 0), 0) / activeCampaigns.length 
    : 0;

  // Filter history
  const filteredHistory = useMemo(() => {
    if (historyType === "all") return history;
    return history.filter(h => h.event_type === historyType);
  }, [history, historyType]);

  const handleVerifyBrand = (brandId: string) => {
    updateBrandStatus.mutate({ brandId, status: "verified" });
  };

  const handleSuspendBrand = (brandId: string) => {
    updateBrandStatus.mutate({ brandId, status: "suspended" });
  };

  const handleApproveApplication = (applicationId: string) => {
    updateApplicationStatus.mutate({ applicationId, status: "approved" });
  };

  const handleRejectApplication = (applicationId: string) => {
    updateApplicationStatus.mutate({ applicationId, status: "rejected" });
  };

  // Map campaign for modal (transform to expected format)
  const mapCampaignForModal = (campaign: Campaign) => ({
    id: parseInt(campaign.id.slice(0, 8), 16),
    title: campaign.title,
    brandName: campaign.brand?.company_name || "N/A",
    brandLogo: campaign.brand?.logo_url || "",
    status: campaign.status,
    budget: campaign.budget,
    startDate: campaign.start_date ? new Date(campaign.start_date) : new Date(),
    endDate: campaign.end_date ? new Date(campaign.end_date) : new Date(),
    creatorsApplied: campaign.creators_applied || 0,
    creatorsApproved: campaign.creators_approved || 0,
    deliverablesCompleted: campaign.deliverables_completed || 0,
    deliverablesTotal: campaign.deliverables_total || 10,
    impressions: campaign.impressions,
    clicks: campaign.clicks,
    conversions: campaign.conversions,
    roi: campaign.clicks > 0 ? Number((campaign.conversions / campaign.clicks * 10).toFixed(1)) : 0,
  });

  // Map brand for modal
  const mapBrandForModal = (brand: Brand) => ({
    id: parseInt(brand.id.slice(0, 8), 16),
    name: brand.company_name,
    legalName: brand.legal_name || brand.company_name,
    cnpj: brand.cnpj,
    logo: brand.logo_url || "",
    website: brand.website || "",
    segment: brand.segment || "N/A",
    size: brand.company_size || "N/A",
    verified: brand.status === "verified",
    suspended: brand.status === "suspended",
    totalCampaigns: brand.total_campaigns || 0,
    activeCampaigns: brand.active_campaigns || 0,
    totalBudget: brand.total_budget || 0,
    createdAt: new Date(brand.created_at),
  });

  return (
    <div className="space-y-6">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full max-w-2xl grid-cols-4">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="campaigns" className="flex items-center gap-2">
              <Megaphone className="h-4 w-4" />
              Campanhas
            </TabsTrigger>
            <TabsTrigger value="applications" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Aplicações
              {applications.length > 0 && (
                <Badge variant="destructive" className="ml-1 h-5 px-1.5">
                  {applications.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              Histórico
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: OVERVIEW */}
          <TabsContent value="overview" className="space-y-6">
            {/* Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total de Brands</p>
                      <p className="text-3xl font-bold">{totalBrands}</p>
                      <p className="text-xs text-green-500 flex items-center mt-1">
                        <ArrowUpRight className="h-3 w-3" />
                        +12% vs mês anterior
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-blue-100">
                      <Building2 className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Brands Verificadas</p>
                      <p className="text-3xl font-bold">
                        {totalBrands > 0 ? ((verifiedBrands / totalBrands) * 100).toFixed(0) : 0}%
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {verifiedBrands} de {totalBrands}
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-green-100">
                      <ShieldCheck className="h-6 w-6 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Campanhas Ativas</p>
                      <p className="text-3xl font-bold">{activeCampaignsCount}</p>
                      <p className="text-xs text-green-500 flex items-center mt-1">
                        <ArrowUpRight className="h-3 w-3" />
                        +5 novas esta semana
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-purple-100">
                      <Megaphone className="h-6 w-6 text-purple-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Budget Total</p>
                      <p className="text-3xl font-bold">R$ {(totalBudget / 1000).toFixed(0)}K</p>
                      <p className="text-xs text-green-500 flex items-center mt-1">
                        <ArrowUpRight className="h-3 w-3" />
                        +18% vs mês anterior
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-yellow-100">
                      <DollarSign className="h-6 w-6 text-yellow-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Filters */}
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-wrap gap-4">
                  <div className="flex-1 min-w-[200px]">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Buscar por nome ou CNPJ..."
                        value={brandSearch}
                        onChange={(e) => setBrandSearch(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                  </div>
                  <Select value={brandStatus} onValueChange={setBrandStatus}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      <SelectItem value="verified">Verificadas</SelectItem>
                      <SelectItem value="pending">Pendentes</SelectItem>
                      <SelectItem value="suspended">Suspensas</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={brandSegment} onValueChange={setBrandSegment}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Segmento" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      {SEGMENTS.map(seg => (
                        <SelectItem key={seg} value={seg}>{seg}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={brandSize} onValueChange={setBrandSize}>
                    <SelectTrigger className="w-[130px]">
                      <SelectValue placeholder="Porte" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      {SIZES.map(size => (
                        <SelectItem key={size} value={size}>{size}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Brands Table */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Brands Cadastradas</CardTitle>
                <CardDescription>
                  Mostrando {filteredBrands.length} de {brands.length} brands
                </CardDescription>
              </CardHeader>
              <CardContent>
                {brandsLoading ? (
                  <div className="space-y-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : filteredBrands.length === 0 ? (
                  <div className="text-center py-12">
                    <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">Nenhuma brand encontrada</p>
                    <p className="text-sm text-muted-foreground">
                      {brands.length === 0 
                        ? "Não há brands cadastradas no sistema ainda."
                        : "Tente ajustar os filtros de busca."}
                    </p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Empresa</TableHead>
                        <TableHead>CNPJ</TableHead>
                        <TableHead>Verificada</TableHead>
                        <TableHead>Campanhas</TableHead>
                        <TableHead>Ativas</TableHead>
                        <TableHead>Budget Gasto</TableHead>
                        <TableHead>Cadastro</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredBrands.slice(0, 20).map((brand) => (
                        <TableRow key={brand.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-10 w-10">
                                <AvatarImage src={brand.logo_url || ""} alt={brand.company_name} />
                                <AvatarFallback>{brand.company_name.slice(0, 2).toUpperCase()}</AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">{brand.company_name}</p>
                                <p className="text-xs text-muted-foreground">{brand.segment || "N/A"}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="font-mono text-sm">{brand.cnpj}</TableCell>
                          <TableCell>
                            {brand.status === "suspended" ? (
                              <Badge variant="destructive">Suspensa</Badge>
                            ) : brand.status === "verified" ? (
                              <CheckCircle className="h-5 w-5 text-green-500" />
                            ) : (
                              <Clock className="h-5 w-5 text-yellow-500" />
                            )}
                          </TableCell>
                          <TableCell>{brand.total_campaigns || 0}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">{brand.active_campaigns || 0}</Badge>
                          </TableCell>
                          <TableCell>R$ {(brand.total_budget || 0).toLocaleString('pt-BR')}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {format(new Date(brand.created_at), "dd/MM/yyyy")}
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => {
                                  setSelectedBrand(brand);
                                  setBrandModalOpen(true);
                                }}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  Ver Perfil
                                </DropdownMenuItem>
                                {brand.status === "pending" && (
                                  <DropdownMenuItem onClick={() => handleVerifyBrand(brand.id)}>
                                    <ShieldCheck className="h-4 w-4 mr-2" />
                                    Verificar
                                  </DropdownMenuItem>
                                )}
                                {brand.status !== "suspended" ? (
                                  <DropdownMenuItem 
                                    className="text-destructive"
                                    onClick={() => handleSuspendBrand(brand.id)}
                                  >
                                    <Ban className="h-4 w-4 mr-2" />
                                    Suspender
                                  </DropdownMenuItem>
                                ) : (
                                  <DropdownMenuItem onClick={() => handleVerifyBrand(brand.id)}>
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    Reativar
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 2: CAMPANHAS ATIVAS */}
          <TabsContent value="campaigns" className="space-y-6">
            {/* Campaign Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Campanhas Ativas</p>
                      <p className="text-3xl font-bold">{activeCampaignsCount}</p>
                    </div>
                    <Megaphone className="h-8 w-8 text-purple-500" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Budget Total</p>
                      <p className="text-3xl font-bold">R$ {(totalBudget / 1000).toFixed(0)}K</p>
                    </div>
                    <DollarSign className="h-8 w-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Creators Trabalhando</p>
                      <p className="text-3xl font-bold">{totalCreatorsWorking}</p>
                    </div>
                    <Users className="h-8 w-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">ROI Médio</p>
                      <p className="text-3xl font-bold">{avgROI.toFixed(1)}x</p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Campaign Cards */}
            {campaignsLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-32 w-full" />
                ))}
              </div>
            ) : activeCampaigns.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Megaphone className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Nenhuma campanha ativa</p>
                  <p className="text-sm text-muted-foreground">
                    Campanhas aparecerão aqui quando brands criarem novas campanhas.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {activeCampaigns.map((campaign) => (
                  <Collapsible
                    key={campaign.id}
                    open={expandedCampaign === campaign.id}
                    onOpenChange={(open) => setExpandedCampaign(open ? campaign.id : null)}
                  >
                    <Card>
                      <CollapsibleTrigger className="w-full">
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <Avatar className="h-12 w-12">
                                <AvatarImage src={campaign.brand?.logo_url || ""} />
                                <AvatarFallback>
                                  {(campaign.brand?.company_name || "N/A").slice(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div className="text-left">
                                <CardTitle className="text-lg">{campaign.title}</CardTitle>
                                <CardDescription>{campaign.brand?.company_name || "N/A"}</CardDescription>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <Badge className={
                                campaign.status === "active" ? "bg-green-500" :
                                campaign.status === "paused" ? "bg-yellow-500" : "bg-muted"
                              }>
                                {campaign.status === "active" ? "Ativa" : "Pausada"}
                              </Badge>
                              {expandedCampaign === campaign.id ? (
                                <ChevronUp className="h-5 w-5" />
                              ) : (
                                <ChevronDown className="h-5 w-5" />
                              )}
                            </div>
                          </div>
                        </CardHeader>
                      </CollapsibleTrigger>

                      <CardContent className="pt-0">
                        {/* Always visible summary */}
                        <div className="grid grid-cols-4 gap-4 py-4 border-b">
                          <div>
                            <p className="text-sm text-muted-foreground">Budget</p>
                            <p className="font-semibold">R$ {((campaign.budget || 0) / 1000).toFixed(0)}K</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Período</p>
                            <p className="font-semibold text-sm">
                              {campaign.start_date ? format(new Date(campaign.start_date), "dd/MM") : "N/A"} → {campaign.end_date ? format(new Date(campaign.end_date), "dd/MM") : "N/A"}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Creators</p>
                            <p className="font-semibold">
                              {campaign.creators_applied || 0} aplicaram | {campaign.creators_approved || 0} aprovados
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Deliverables</p>
                            <div className="flex items-center gap-2">
                              <p className="font-semibold">
                                {campaign.deliverables_completed || 0}/{campaign.deliverables_total || 10}
                              </p>
                              <Progress 
                                value={((campaign.deliverables_completed || 0) / (campaign.deliverables_total || 10)) * 100} 
                                className="w-16 h-2"
                              />
                            </div>
                          </div>
                        </div>

                        <CollapsibleContent>
                          <div className="grid grid-cols-4 gap-4 py-4 border-b">
                            <div className="text-center p-3 bg-muted rounded-lg">
                              <p className="text-2xl font-bold">{((campaign.impressions || 0) / 1000).toFixed(0)}K</p>
                              <p className="text-xs text-muted-foreground">Impressões</p>
                            </div>
                            <div className="text-center p-3 bg-muted rounded-lg">
                              <p className="text-2xl font-bold">{(campaign.clicks || 0).toLocaleString()}</p>
                              <p className="text-xs text-muted-foreground">Clicks</p>
                            </div>
                            <div className="text-center p-3 bg-muted rounded-lg">
                              <p className="text-2xl font-bold">{campaign.conversions || 0}</p>
                              <p className="text-xs text-muted-foreground">Conversões</p>
                            </div>
                            <div className="text-center p-3 bg-muted rounded-lg">
                              <p className="text-2xl font-bold text-green-500">
                                {campaign.clicks > 0 ? (campaign.conversions / campaign.clicks * 10).toFixed(1) : 0}x
                              </p>
                              <p className="text-xs text-muted-foreground">ROI</p>
                            </div>
                          </div>

                          <div className="pt-4">
                            <Button onClick={() => {
                              setSelectedCampaign(campaign);
                              setCampaignModalOpen(true);
                            }}>
                              <Eye className="h-4 w-4 mr-2" />
                              Ver Detalhes
                            </Button>
                          </div>
                        </CollapsibleContent>
                      </CardContent>
                    </Card>
                  </Collapsible>
                ))}
              </div>
            )}
          </TabsContent>

          {/* TAB 3: APLICAÇÕES PENDENTES */}
          <TabsContent value="applications" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">Aplicações Pendentes</CardTitle>
                    <CardDescription>
                      {applications.length} aplicações aguardando revisão
                    </CardDescription>
                  </div>
                  {applications.length > 0 && (
                    <Badge variant="destructive" className="text-lg px-4 py-2">
                      {applications.length} pendentes
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {applicationsLoading ? (
                  <div className="space-y-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <Skeleton key={i} className="h-32 w-full" />
                    ))}
                  </div>
                ) : applications.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">Nenhuma aplicação pendente</p>
                    <p className="text-sm text-muted-foreground">
                      Todas as aplicações foram revisadas.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {applications.map((app) => (
                      <Card key={app.id} className="border">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-4">
                              <Avatar className="h-14 w-14">
                                <AvatarImage src={app.creator?.avatar_url || ""} />
                                <AvatarFallback>
                                  {(app.creator?.name || "?").slice(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <p className="font-semibold">{app.creator?.name || "N/A"}</p>
                                  <span className="text-muted-foreground">@{app.creator?.username || "N/A"}</span>
                                </div>
                                <div className="mt-2">
                                  <p className="text-sm font-medium">
                                    Campanha: {app.campaign?.title || "N/A"}{" "}
                                    <span className="text-muted-foreground">
                                      ({app.campaign?.brand?.company_name || "N/A"})
                                    </span>
                                  </p>
                                </div>
                                {app.message && (
                                  <p className="text-sm text-muted-foreground mt-2 max-w-xl">
                                    "{app.message}"
                                  </p>
                                )}
                                <div className="flex items-center gap-4 mt-2 text-sm">
                                  <span className="font-medium">
                                    Fee: R$ {(app.proposed_fee || 0).toLocaleString('pt-BR')}
                                  </span>
                                  {app.proposed_deliverables && (
                                    <>
                                      <span className="text-muted-foreground">|</span>
                                      <span className="text-muted-foreground">{app.proposed_deliverables}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <p className="text-xs text-muted-foreground">
                                {format(new Date(app.created_at), "dd/MM 'às' HH:mm", { locale: ptBR })}
                              </p>
                              <div className="flex gap-2 mt-2">
                                <Button variant="outline" size="sm">
                                  <Eye className="h-4 w-4 mr-1" />
                                  Ver Perfil
                                </Button>
                                <Button 
                                  variant="destructive" 
                                  size="sm"
                                  onClick={() => handleRejectApplication(app.id)}
                                  disabled={updateApplicationStatus.isPending}
                                >
                                  {updateApplicationStatus.isPending ? (
                                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                  ) : (
                                    <XCircle className="h-4 w-4 mr-1" />
                                  )}
                                  Rejeitar
                                </Button>
                                <Button 
                                  size="sm" 
                                  className="bg-green-500 hover:bg-green-600"
                                  onClick={() => handleApproveApplication(app.id)}
                                  disabled={updateApplicationStatus.isPending}
                                >
                                  {updateApplicationStatus.isPending ? (
                                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                  ) : (
                                    <CheckCircle className="h-4 w-4 mr-1" />
                                  )}
                                  Aprovar
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 4: HISTÓRICO */}
          <TabsContent value="history" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Histórico de Atividades</CardTitle>
                  <Select value={historyType} onValueChange={setHistoryType}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Filtrar por tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="campaign_created">Campanhas Criadas</SelectItem>
                      <SelectItem value="campaign_completed">Campanhas Concluídas</SelectItem>
                      <SelectItem value="brand_verified">Brands Verificadas</SelectItem>
                      <SelectItem value="creator_approved">Creators Aprovados</SelectItem>
                      <SelectItem value="payment_sent">Pagamentos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                {historyLoading ? (
                  <div className="space-y-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : filteredHistory.length === 0 ? (
                  <div className="text-center py-12">
                    <History className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">Nenhum histórico encontrado</p>
                    <p className="text-sm text-muted-foreground">
                      Atividades aparecerão aqui conforme ações são realizadas.
                    </p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Descrição</TableHead>
                        <TableHead>Brand</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead>Data</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredHistory.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <Badge variant="outline" className={
                              item.event_type === "campaign_created" ? "border-purple-500 text-purple-500" :
                              item.event_type === "campaign_completed" ? "border-green-500 text-green-500" :
                              item.event_type === "brand_verified" ? "border-blue-500 text-blue-500" :
                              item.event_type === "creator_approved" ? "border-yellow-500 text-yellow-500" :
                              "border-green-500 text-green-500"
                            }>
                              {item.event_type === "campaign_created" ? "Campanha" :
                               item.event_type === "campaign_completed" ? "Concluída" :
                               item.event_type === "brand_verified" ? "Verificação" :
                               item.event_type === "creator_approved" ? "Aprovação" : "Pagamento"}
                            </Badge>
                          </TableCell>
                          <TableCell>{item.description}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {(item.brand as { company_name?: string })?.company_name || "N/A"}
                          </TableCell>
                          <TableCell>
                            {item.amount ? (
                              <span className="font-medium text-green-500">
                                R$ {item.amount.toLocaleString('pt-BR')}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {format(new Date(item.created_at), "dd/MM/yyyy HH:mm")}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Modals */}
        <BrandProfileModal
          brand={selectedBrand ? mapBrandForModal(selectedBrand) : null}
          open={brandModalOpen}
          onOpenChange={setBrandModalOpen}
        />
        <CampaignDetailsModal
          campaign={selectedCampaign ? mapCampaignForModal(selectedCampaign) : null}
          open={campaignModalOpen}
          onOpenChange={setCampaignModalOpen}
        />
      </div>
  );
}
