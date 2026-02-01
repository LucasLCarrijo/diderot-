import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertTriangle,
  CheckCircle,
  XCircle,
  Flag,
  User,
  ShoppingBag,
  Image as ImageIcon,
  Clock,
  Eye,
  Ban,
  Shield,
  Bot,
  FileCheck,
  Search,
  Download,
  Building2,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { ReportDetailsModal } from "@/components/admin/ReportDetailsModal";
import { VerificationCard } from "@/components/admin/VerificationCard";
import {
  useReports,
  useReportStats,
  useUpdateReportStatus,
  useModerationActions,
  type Report,
} from "@/hooks/useModeration";
import {
  useCreatorVerificationRequests,
  useBrandVerificationRequests,
  useApproveVerification,
  useRejectVerification,
} from "@/hooks/useAdminSettings";
import { useAdminExport } from "@/hooks/useAdminExport";

const reportReasons: Record<string, string> = {
  spam: "Spam",
  inappropriate: "Conteúdo Inapropriado",
  fraud: "Fraude/Golpe",
  copyright: "Violação de Copyright",
  impersonation: "Falsidade Ideológica",
  other: "Outro",
};

const reportTypes: Record<string, { icon: any; label: string }> = {
  user: { icon: User, label: "Usuário" },
  product: { icon: ShoppingBag, label: "Produto" },
  post: { icon: ImageIcon, label: "Post" },
};

const priorityColors: Record<string, string> = {
  critical: "bg-red-600 text-white",
  high: "bg-orange-500 text-white",
  medium: "bg-yellow-500 text-white",
  low: "bg-gray-400 text-white",
};

const actionTypeLabels: Record<string, { label: string; color: string }> = {
  resolved: { label: "Resolvido", color: "bg-green-500" },
  dismissed: { label: "Ignorado", color: "bg-gray-500" },
  removed: { label: "Removido", color: "bg-red-500" },
  warning: { label: "Warning", color: "bg-yellow-500" },
  suspended: { label: "Suspenso", color: "bg-orange-500" },
  banned: { label: "Banido", color: "bg-red-700" },
  verified: { label: "Verificado", color: "bg-green-600" },
};

export default function AdminModeration() {
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [reportModalOpen, setReportModalOpen] = useState(false);

  // Filters
  const [reportTypeFilter, setReportTypeFilter] = useState("all");
  const [reportReasonFilter, setReportReasonFilter] = useState("all");
  const [reportPriorityFilter, setReportPriorityFilter] = useState("all");
  const [reportSort, setReportSort] = useState("recent");
  const [searchTerm, setSearchTerm] = useState("");

  const [verificationTab, setVerificationTab] = useState("creators");

  const [historyActionFilter, setHistoryActionFilter] = useState("all");

  // Data fetching
  const { data: reports, isLoading: reportsLoading } = useReports("pending");
  const { data: stats } = useReportStats();
  const { data: actions, isLoading: actionsLoading } = useModerationActions();
  const updateReportStatus = useUpdateReportStatus();

  // Verification requests - Real data
  const { data: creatorVerifications, isLoading: creatorsLoading } = useCreatorVerificationRequests();
  const { data: brandVerifications, isLoading: brandsLoading } = useBrandVerificationRequests();
  const approveVerification = useApproveVerification();
  const rejectVerification = useRejectVerification();

  const { isExporting, exportClicks } = useAdminExport();

  type EnhancedReport = Report & { priority: string; reportCount: number };

  // Computed values
  const pendingReports = useMemo((): EnhancedReport[] => {
    let filtered = reports || [];

    if (reportTypeFilter !== "all") {
      filtered = filtered.filter((r) => r.reported_type === reportTypeFilter);
    }
    if (reportReasonFilter !== "all") {
      filtered = filtered.filter((r) => r.reason === reportReasonFilter);
    }
    if (searchTerm) {
      filtered = filtered.filter(
        (r) =>
          r.reported_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          r.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Add priority based on reason
    let enhanced: EnhancedReport[] = filtered.map((r) => ({
      ...r,
      priority:
        r.reason === "fraud"
          ? "critical"
          : r.reason === "inappropriate"
          ? "high"
          : r.reason === "spam"
          ? "medium"
          : "low",
      reportCount: 1, // Real count would come from aggregation
    }));

    // Sort
    if (reportSort === "recent") {
      enhanced.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } else if (reportSort === "reports") {
      enhanced.sort((a, b) => b.reportCount - a.reportCount);
    } else if (reportSort === "priority") {
      const priorityOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
      enhanced.sort(
        (a, b) =>
          (priorityOrder[a.priority] || 3) - (priorityOrder[b.priority] || 3)
      );
    }

    if (reportPriorityFilter !== "all") {
      enhanced = enhanced.filter((r) => r.priority === reportPriorityFilter);
    }

    return enhanced;
  }, [reports, reportTypeFilter, reportReasonFilter, reportPriorityFilter, reportSort, searchTerm]);

  const filteredActions = useMemo(() => {
    let filtered = actions || [];
    if (historyActionFilter !== "all") {
      filtered = filtered.filter((a) => a.action_type === historyActionFilter);
    }
    return filtered;
  }, [actions, historyActionFilter]);

  const handleReportAction = (reportId: string, action: string, notes?: string) => {
    const statusMap: Record<string, string> = {
      dismiss: "dismissed",
      remove: "resolved",
      warning: "resolved",
      suspend: "resolved",
      ban: "resolved",
    };

    updateReportStatus.mutate(
      { reportId, status: statusMap[action] || "resolved", notes },
      {
        onSuccess: () => {
          setReportModalOpen(false);
          setSelectedReport(null);
          toast.success(`Ação "${action}" aplicada com sucesso`);
        },
      }
    );
  };

  const handleVerificationApprove = (id: string, type?: "creator" | "brand") => {
    const verificationType = type || (verificationTab === "creators" ? "creator" : "brand");
    approveVerification.mutate({ id, type: verificationType as "creator" | "brand" });
  };

  const handleVerificationReject = (id: string, reason: string) => {
    const type = verificationTab === "creators" ? "creator" : "brand";
    rejectVerification.mutate({ id, type: type as "creator" | "brand", reason });
  };

  const handleVerificationRequestInfo = (id: string) => {
    toast.info("Solicitação de mais informações enviada");
  };

  const exportToCSV = () => {
    exportClicks();
  };

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Header with Alert Badges */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold">Moderação</h1>
          <p className="text-sm text-muted-foreground">
            Gerencie reports, verificações e moderação de conteúdo
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge className="bg-red-600 text-white px-2 lg:px-3 py-1 text-xs lg:text-sm">
            <Flag className="h-3 w-3 mr-1" />
            <span className="hidden sm:inline">{stats?.pending || 0} reports</span>
            <span className="sm:hidden">{stats?.pending || 0}</span>
          </Badge>
          <Badge className="bg-blue-500 text-white px-2 lg:px-3 py-1 text-xs lg:text-sm">
            <FileCheck className="h-3 w-3 mr-1" />
            <span className="hidden sm:inline">
              {(creatorVerifications?.length || 0) + (brandVerifications?.length || 0)} verificações
            </span>
            <span className="sm:hidden">
              {(creatorVerifications?.length || 0) + (brandVerifications?.length || 0)}
            </span>
          </Badge>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        <Card className="border-admin-border">
          <CardContent className="p-3 lg:p-4">
            <div className="flex items-center gap-2 lg:gap-3">
              <div className="p-1.5 lg:p-2 rounded-lg bg-red-500/10">
                <Flag className="h-4 lg:h-5 w-4 lg:w-5 text-red-500" />
              </div>
              <div>
                <p className="text-xs lg:text-sm text-muted-foreground">Pendentes</p>
                <p className="text-lg lg:text-2xl font-semibold text-red-500">{stats?.pending || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-admin-border">
          <CardContent className="p-3 lg:p-4">
            <div className="flex items-center gap-2 lg:gap-3">
              <div className="p-1.5 lg:p-2 rounded-lg bg-green-500/10">
                <CheckCircle className="h-4 lg:h-5 w-4 lg:w-5 text-green-500" />
              </div>
              <div>
                <p className="text-xs lg:text-sm text-muted-foreground">Resolvidos</p>
                <p className="text-lg lg:text-2xl font-semibold">{stats?.resolved || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-admin-border">
          <CardContent className="p-3 lg:p-4">
            <div className="flex items-center gap-2 lg:gap-3">
              <div className="p-1.5 lg:p-2 rounded-lg bg-yellow-500/10">
                <Clock className="h-4 lg:h-5 w-4 lg:w-5 text-yellow-500" />
              </div>
              <div>
                <p className="text-xs lg:text-sm text-muted-foreground">Tempo Médio</p>
                <p className="text-lg lg:text-2xl font-semibold">{stats?.avgResolutionTime || 0}h</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-admin-border">
          <CardContent className="p-3 lg:p-4">
            <div className="flex items-center gap-2 lg:gap-3">
              <div className="p-1.5 lg:p-2 rounded-lg bg-purple-500/10">
                <Shield className="h-4 lg:h-5 w-4 lg:w-5 text-purple-500" />
              </div>
              <div>
                <p className="text-xs lg:text-sm text-muted-foreground">Total</p>
                <p className="text-lg lg:text-2xl font-semibold">{stats?.total || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Card className="border-admin-border">
        <CardContent className="p-3 sm:p-4 lg:p-6">
          <Tabs defaultValue="reports">
            <div className="overflow-x-auto -mx-3 sm:-mx-4 lg:-mx-6 px-3 sm:px-4 lg:px-6 hide-scrollbar">
              <TabsList className="inline-flex w-auto min-w-full lg:grid lg:grid-cols-3 gap-1">
                <TabsTrigger value="reports" className="flex items-center gap-1 lg:gap-2 px-3 lg:px-4 whitespace-nowrap">
                  <Flag className="h-3 lg:h-4 w-3 lg:w-4" />
                  <span className="hidden sm:inline">Reports</span>
                  {(stats?.pending || 0) > 0 && (
                    <Badge className="bg-red-600 text-white text-[10px] lg:text-xs px-1 lg:px-1.5">
                      {stats?.pending}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="verifications" className="flex items-center gap-1 lg:gap-2 px-3 lg:px-4 whitespace-nowrap">
                  <FileCheck className="h-3 lg:h-4 w-3 lg:w-4" />
                  <span className="hidden sm:inline">Verificações</span>
                  <Badge className="bg-blue-500 text-white text-[10px] lg:text-xs px-1 lg:px-1.5">
                    {(creatorVerifications?.length || 0) + (brandVerifications?.length || 0)}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="history" className="flex items-center gap-1 lg:gap-2 px-3 lg:px-4 whitespace-nowrap">
                  <Clock className="h-3 lg:h-4 w-3 lg:w-4" />
                  <span className="hidden sm:inline">Histórico</span>
                </TabsTrigger>
              </TabsList>
            </div>

            {/* TAB 1: Reports Pendentes */}
            <TabsContent value="reports" className="mt-4 lg:mt-6 space-y-4">
              {/* Filters */}
              <div className="flex flex-wrap items-center gap-4">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por ID ou descrição..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={reportTypeFilter} onValueChange={setReportTypeFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="user">Usuário</SelectItem>
                    <SelectItem value="product">Produto</SelectItem>
                    <SelectItem value="post">Post</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={reportReasonFilter} onValueChange={setReportReasonFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Motivo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="spam">Spam</SelectItem>
                    <SelectItem value="inappropriate">Inapropriado</SelectItem>
                    <SelectItem value="fraud">Fraude</SelectItem>
                    <SelectItem value="copyright">Copyright</SelectItem>
                    <SelectItem value="other">Outro</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={reportPriorityFilter} onValueChange={setReportPriorityFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Prioridade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="critical">Crítico</SelectItem>
                    <SelectItem value="high">Alto</SelectItem>
                    <SelectItem value="medium">Médio</SelectItem>
                    <SelectItem value="low">Baixo</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={reportSort} onValueChange={setReportSort}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Ordenar por" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="recent">Mais recente</SelectItem>
                    <SelectItem value="reports">Mais reports</SelectItem>
                    <SelectItem value="priority">Prioridade</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Reports Queue */}
              {reportsLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-32 w-full" />
                  ))}
                </div>
              ) : pendingReports.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <p className="text-lg font-medium">Nenhum report pendente!</p>
                  <p className="text-muted-foreground">Todos os reports foram revisados.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingReports.map((report: any) => {
                    const TypeInfo = reportTypes[report.reported_type] || reportTypes.user;
                    const Icon = TypeInfo.icon;

                    return (
                      <Card key={report.id} className="border-admin-border hover:bg-muted/30 transition-colors">
                        <CardContent className="p-4">
                          <div className="flex items-start gap-4">
                            {/* Priority indicator */}
                            <div
                              className={`w-1 h-full min-h-[80px] rounded-full ${
                                report.priority === "critical"
                                  ? "bg-red-500"
                                  : report.priority === "high"
                                  ? "bg-orange-500"
                                  : report.priority === "medium"
                                  ? "bg-yellow-500"
                                  : "bg-gray-400"
                              }`}
                            />

                            {/* Content preview */}
                            <div className="p-2 rounded-lg bg-muted">
                              <Icon className="h-8 w-8" />
                            </div>

                            {/* Info */}
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center gap-2 flex-wrap">
                                <Badge variant="outline">{TypeInfo.label}</Badge>
                                <Badge className={priorityColors[report.priority || "medium"]}>
                                  {report.priority === "critical"
                                    ? "Crítico"
                                    : report.priority === "high"
                                    ? "Alto"
                                    : report.priority === "medium"
                                    ? "Médio"
                                    : "Baixo"}
                                </Badge>
                                <Badge
                                  className={
                                    report.reason === "fraud"
                                      ? "bg-red-600 text-white"
                                      : report.reason === "spam"
                                      ? "bg-yellow-600 text-white"
                                      : "bg-muted text-foreground"
                                  }
                                >
                                  {reportReasons[report.reason] || report.reason}
                                </Badge>
                              </div>

                              <p className="text-sm text-muted-foreground">
                                ID: {report.reported_id.slice(0, 12)}...
                              </p>

                              {report.description && (
                                <p className="text-sm bg-muted p-2 rounded line-clamp-2">
                                  "{report.description}"
                                </p>
                              )}

                              <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {format(new Date(report.created_at), "dd/MM/yyyy 'às' HH:mm", {
                                  locale: ptBR,
                                })}
                              </p>
                            </div>

                            {/* Actions */}
                            <div className="flex flex-col gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedReport(report);
                                  setReportModalOpen(true);
                                }}
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                Detalhes
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleReportAction(report.id, "dismiss")}
                                disabled={updateReportStatus.isPending}
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Aprovar
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-orange-500"
                                onClick={() => handleReportAction(report.id, "remove")}
                                disabled={updateReportStatus.isPending}
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Remover
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleReportAction(report.id, "ban")}
                                disabled={updateReportStatus.isPending}
                              >
                                <Ban className="h-4 w-4 mr-1" />
                                Banir
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            {/* TAB 2: Verificações */}
            <TabsContent value="verifications" className="mt-6 space-y-4">
              <Tabs value={verificationTab} onValueChange={setVerificationTab}>
                <TabsList>
                  <TabsTrigger value="creators" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Creators
                    <Badge variant="secondary">{creatorVerifications?.length || 0}</Badge>
                  </TabsTrigger>
                  <TabsTrigger value="brands" className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Brands
                    <Badge variant="secondary">{brandVerifications?.length || 0}</Badge>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="creators" className="mt-4 space-y-4">
                  {creatorsLoading ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-40 w-full" />
                      ))}
                    </div>
                  ) : creatorVerifications?.length === 0 ? (
                    <div className="text-center py-12">
                      <FileCheck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-lg font-medium">Nenhuma verificação pendente</p>
                      <p className="text-muted-foreground">
                        Creators precisam ter 1000+ followers e 10+ produtos para solicitar verificação
                      </p>
                    </div>
                  ) : (
                    creatorVerifications?.map((request) => (
                      <VerificationCard
                        key={request.id}
                        request={{
                          id: request.id,
                          type: "creator",
                          name: request.name,
                          username: request.username,
                          avatar: request.avatar_url,
                          followers: request.followers,
                          products: request.products,
                          hasProfileComplete: request.hasProfileComplete,
                          hasMinFollowers: request.hasMinFollowers,
                          hasMinProducts: request.hasMinProducts,
                          hasNoWarnings: request.hasNoWarnings,
                          createdAt: request.created_at,
                        }}
                        onApprove={() => handleVerificationApprove(request.id, "creator")}
                        onReject={handleVerificationReject}
                        onRequestInfo={handleVerificationRequestInfo}
                      />
                    ))
                  )}
                </TabsContent>

                <TabsContent value="brands" className="mt-4 space-y-4">
                  {brandsLoading ? (
                    <div className="space-y-4">
                      {[1, 2].map((i) => (
                        <Skeleton key={i} className="h-40 w-full" />
                      ))}
                    </div>
                  ) : brandVerifications?.length === 0 ? (
                    <div className="text-center py-12">
                      <FileCheck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-lg font-medium">Nenhuma verificação pendente</p>
                    </div>
                  ) : (
                    brandVerifications?.map((request) => (
                      <VerificationCard
                        key={request.id}
                        request={{
                          id: request.id,
                          type: "brand",
                          name: request.name,
                          avatar: request.avatar_url,
                          cnpj: request.cnpj,
                          website: request.website,
                          segment: request.segment,
                          companySize: request.company_size,
                          createdAt: request.created_at,
                        }}
                        onApprove={() => handleVerificationApprove(request.id, "brand")}
                        onReject={handleVerificationReject}
                        onRequestInfo={handleVerificationRequestInfo}
                      />
                    ))
                  )}
                </TabsContent>
              </Tabs>
            </TabsContent>

            {/* TAB 3: Histórico */}
            <TabsContent value="history" className="mt-6 space-y-4">
              {/* Filters */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Select value={historyActionFilter} onValueChange={setHistoryActionFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Ação" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      <SelectItem value="resolved">Resolvido</SelectItem>
                      <SelectItem value="dismissed">Ignorado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button variant="outline" size="sm" onClick={exportToCSV} disabled={isExporting}>
                  <Download className="h-4 w-4 mr-1" />
                  {isExporting ? "Exportando..." : "Exportar CSV"}
                </Button>
              </div>

              {/* History Table */}
              {actionsLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : filteredActions.length === 0 ? (
                <div className="text-center py-12">
                  <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-lg font-medium">Nenhuma ação registrada</p>
                </div>
              ) : (
                <ScrollArea className="h-[400px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Ação</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Target</TableHead>
                        <TableHead>Data</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredActions.map((action) => (
                        <TableRow key={action.id}>
                          <TableCell>
                            <Badge
                              className={
                                actionTypeLabels[action.action_type]?.color || "bg-gray-500"
                              }
                            >
                              {actionTypeLabels[action.action_type]?.label || action.action_type}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {action.target_type || "-"}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {action.target_id?.slice(0, 12) || "-"}...
                          </TableCell>
                          <TableCell>
                            {format(new Date(action.created_at), "dd/MM/yyyy HH:mm", {
                              locale: ptBR,
                            })}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Report Details Modal */}
      <ReportDetailsModal
        report={selectedReport}
        open={reportModalOpen}
        onOpenChange={setReportModalOpen}
        onAction={handleReportAction}
      />
    </div>
  );
}
