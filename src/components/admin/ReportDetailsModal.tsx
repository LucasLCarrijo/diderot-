import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  AlertTriangle,
  User,
  ShoppingBag,
  Image as ImageIcon,
  Clock,
  Eye,
  MessageSquare,
  CheckCircle,
  XCircle,
  Ban,
  AlertCircle,
  FileText,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useState } from "react";

interface Report {
  id: string;
  reported_type: string;
  reported_id: string;
  reason: string;
  description: string | null;
  status: string;
  created_at: string;
  reporter_id: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  reporterName?: string;
  reporterAvatar?: string;
  reportCount?: number;
  priority?: "critical" | "high" | "medium" | "low";
  contentPreview?: {
    type: string;
    title?: string;
    image?: string;
    username?: string;
    bio?: string;
  };
}

interface ReportDetailsModalProps {
  report: Report | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAction: (reportId: string, action: string, notes?: string) => void;
  isLoading?: boolean;
}

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

export function ReportDetailsModal({
  report,
  open,
  onOpenChange,
  onAction,
  isLoading,
}: ReportDetailsModalProps) {
  const [adminNotes, setAdminNotes] = useState("");

  if (!report) return null;

  const TypeInfo = reportTypes[report.reported_type] || reportTypes.user;
  const Icon = TypeInfo.icon;

  // Mock data for author history (would come from real data)
  const authorHistory = {
    previousReports: 2,
    warnings: 1,
    suspensions: 0,
    accountAge: "8 meses",
    totalContent: 45,
  };

  // Mock additional reporters
  const additionalReporters = [
    { name: "Usuário 1", avatar: "", reason: "spam", date: "2024-01-15" },
    { name: "Usuário 2", avatar: "", reason: "inappropriate", date: "2024-01-14" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Icon className="h-5 w-5" />
            Detalhes do Report - {TypeInfo.label}
            <Badge className={priorityColors[report.priority || "medium"]}>
              {report.priority === "critical" ? "Crítico" :
               report.priority === "high" ? "Alto" :
               report.priority === "medium" ? "Médio" : "Baixo"}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="h-[calc(90vh-180px)]">
          <Tabs defaultValue="content" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="content">Conteúdo</TabsTrigger>
              <TabsTrigger value="reports">Reports ({report.reportCount || 1})</TabsTrigger>
              <TabsTrigger value="history">Histórico do Autor</TabsTrigger>
              <TabsTrigger value="notes">Notas</TabsTrigger>
            </TabsList>

            <TabsContent value="content" className="mt-4 space-y-4">
              {/* Content Preview */}
              <div className="border rounded-lg p-4">
                <h4 className="font-medium mb-3">Preview do Conteúdo Reportado</h4>
                <div className="flex gap-4">
                  {report.contentPreview?.image && (
                    <img
                      src={report.contentPreview.image}
                      alt="Preview"
                      className="w-32 h-32 object-cover rounded-lg"
                    />
                  )}
                  <div className="flex-1">
                    {report.contentPreview?.type === "user" ? (
                      <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={report.contentPreview.image} />
                          <AvatarFallback>{report.contentPreview.username?.[0]?.toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{report.contentPreview.username}</p>
                          <p className="text-sm text-muted-foreground">{report.contentPreview.bio}</p>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className="font-medium">{report.contentPreview?.title || "Sem título"}</p>
                        <p className="text-sm text-muted-foreground">ID: {report.reported_id}</p>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Reason and Description */}
              <div className="border rounded-lg p-4">
                <h4 className="font-medium mb-3">Motivo do Report</h4>
                <Badge className="mb-2">{reportReasons[report.reason] || report.reason}</Badge>
                {report.description && (
                  <p className="text-sm bg-muted p-3 rounded mt-2">"{report.description}"</p>
                )}
              </div>

              {/* Content Metrics */}
              <div className="border rounded-lg p-4">
                <h4 className="font-medium mb-3">Métricas do Conteúdo</h4>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Views</p>
                    <p className="font-medium">1,234</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Cliques</p>
                    <p className="font-medium">89</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Favoritos</p>
                    <p className="font-medium">23</p>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="reports" className="mt-4 space-y-4">
              {/* First Report */}
              <div className="border rounded-lg p-4">
                <div className="flex items-center gap-3 mb-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={report.reporterAvatar} />
                    <AvatarFallback>R</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-sm">{report.reporterName || "Anônimo"}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(report.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                  <Badge className="ml-auto">{reportReasons[report.reason]}</Badge>
                </div>
                {report.description && (
                  <p className="text-sm bg-muted p-3 rounded">"{report.description}"</p>
                )}
              </div>

              {/* Additional Reports */}
              {additionalReporters.map((reporter, idx) => (
                <div key={idx} className="border rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={reporter.avatar} />
                      <AvatarFallback>{reporter.name[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-sm">{reporter.name}</p>
                      <p className="text-xs text-muted-foreground">{reporter.date}</p>
                    </div>
                    <Badge className="ml-auto">{reportReasons[reporter.reason]}</Badge>
                  </div>
                </div>
              ))}
            </TabsContent>

            <TabsContent value="history" className="mt-4 space-y-4">
              <div className="border rounded-lg p-4">
                <h4 className="font-medium mb-3">Histórico do Autor</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-orange-500" />
                    <span>Reports anteriores: {authorHistory.previousReports}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-yellow-500" />
                    <span>Warnings: {authorHistory.warnings}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Ban className="h-4 w-4 text-red-500" />
                    <span>Suspensões: {authorHistory.suspensions}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>Conta criada: {authorHistory.accountAge}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span>Total de conteúdo: {authorHistory.totalContent}</span>
                  </div>
                </div>
              </div>

              {authorHistory.warnings > 0 && (
                <div className="border rounded-lg p-4 border-yellow-500/30 bg-yellow-500/5">
                  <h4 className="font-medium mb-2 text-yellow-600">⚠️ Warnings Anteriores</h4>
                  <p className="text-sm">
                    Este usuário já recebeu {authorHistory.warnings} warning(s) por violações anteriores.
                  </p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="notes" className="mt-4 space-y-4">
              <div className="border rounded-lg p-4">
                <h4 className="font-medium mb-3">Notas Administrativas</h4>
                <Textarea
                  placeholder="Adicione observações sobre este caso..."
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  rows={4}
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Essas notas ficarão registradas no histórico de ações.
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </ScrollArea>

        <Separator className="my-4" />

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2 justify-end">
          <Button
            variant="outline"
            onClick={() => onAction(report.id, "dismiss", adminNotes)}
            disabled={isLoading}
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Aprovar (Dismiss)
          </Button>
          <Button
            variant="outline"
            onClick={() => onAction(report.id, "remove", adminNotes)}
            disabled={isLoading}
            className="text-orange-500 hover:text-orange-600"
          >
            <XCircle className="h-4 w-4 mr-2" />
            Remover Conteúdo
          </Button>
          <Button
            variant="outline"
            onClick={() => onAction(report.id, "warning", adminNotes)}
            disabled={isLoading}
            className="text-yellow-600 hover:text-yellow-700"
          >
            <AlertCircle className="h-4 w-4 mr-2" />
            Warning
          </Button>
          <Button
            variant="outline"
            onClick={() => onAction(report.id, "suspend", adminNotes)}
            disabled={isLoading}
            className="text-orange-600 hover:text-orange-700"
          >
            <AlertTriangle className="h-4 w-4 mr-2" />
            Suspender (7d)
          </Button>
          <Button
            variant="destructive"
            onClick={() => onAction(report.id, "ban", adminNotes)}
            disabled={isLoading}
          >
            <Ban className="h-4 w-4 mr-2" />
            Banir
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
