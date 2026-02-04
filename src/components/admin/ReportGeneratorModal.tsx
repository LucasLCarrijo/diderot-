import { useState } from "react";
import { format as formatDate } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { generatePDF, generateCSV, generateExcel, generateJSON } from "@/lib/report-generator";
import {
  FileText,
  FileSpreadsheet,
  FileJson,
  FileDown,
  Calendar as CalendarIcon,
  Clock,
  Mail,
  Download,
  Play,
  Pause,
  Trash2,
  Edit,
  Send,
  Loader2,
  Check,
  X,
  Plus,
  Eye,
  BarChart3,
  Users,
  DollarSign,
  MousePointerClick,
  Star,
  Package,
  Megaphone,
  Settings,
  RefreshCw,
} from "lucide-react";
import { DateRange } from "react-day-picker";

interface ReportGeneratorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const reportTypes = [
  { id: "executive", label: "Relatório Executivo", description: "Overview com principais KPIs", icon: BarChart3 },
  { id: "users", label: "Relatório de Usuários", description: "Métricas de crescimento e retenção", icon: Users },
  { id: "financial", label: "Relatório Financeiro", description: "MRR, ARR, churn, LTV", icon: DollarSign },
  { id: "engagement", label: "Relatório de Engagement", description: "Clicks, favoritos, follows", icon: MousePointerClick },
  { id: "creators", label: "Relatório de Creators", description: "Performance individual", icon: Star },
  { id: "products", label: "Relatório de Produtos", description: "Top produtos, categorias", icon: Package },
  { id: "campaigns", label: "Relatório de Campanhas", description: "ROI, performance", icon: Megaphone },
  { id: "custom", label: "Relatório Customizado", description: "Selecionar métricas", icon: Settings },
];

const periodOptions = [
  { id: "week", label: "Última semana" },
  { id: "month", label: "Último mês" },
  { id: "quarter", label: "Últimos 3 meses" },
  { id: "year", label: "Último ano" },
  { id: "custom", label: "Customizado" },
];

const formatOptions = [
  { id: "pdf", label: "PDF", description: "Visualmente formatado, com gráficos", icon: FileText },
  { id: "csv", label: "CSV", description: "Dados tabulares para análise", icon: FileSpreadsheet },
  { id: "excel", label: "Excel", description: "Múltiplas abas, gráficos", icon: FileSpreadsheet },
  { id: "json", label: "JSON", description: "Para integração com outras ferramentas", icon: FileJson },
];

const mockScheduledReports = [
  { id: "1", type: "executive", frequency: "weekly", day: "Segunda", time: "08:00", recipients: ["admin@diderot.com"], format: "pdf", active: true },
  { id: "2", type: "financial", frequency: "monthly", day: "1", time: "09:00", recipients: ["finance@diderot.com", "ceo@diderot.com"], format: "excel", active: true },
  { id: "3", type: "engagement", frequency: "daily", day: "-", time: "06:00", recipients: ["marketing@diderot.com"], format: "csv", active: false },
];

const mockReportHistory = [
  { id: "1", type: "executive", period: "01/12/2024 - 31/12/2024", generatedBy: "Admin", generatedAt: new Date("2024-12-31T10:00:00"), status: "generated", format: "pdf" },
  { id: "2", type: "financial", period: "01/12/2024 - 31/12/2024", generatedBy: "Sistema", generatedAt: new Date("2024-12-31T09:00:00"), status: "sent", format: "excel" },
  { id: "3", type: "users", period: "24/12/2024 - 31/12/2024", generatedBy: "Admin", generatedAt: new Date("2024-12-30T14:00:00"), status: "generated", format: "csv" },
  { id: "4", type: "engagement", period: "30/12/2024", generatedBy: "Sistema", generatedAt: new Date("2024-12-30T06:00:00"), status: "error", format: "pdf" },
  { id: "5", type: "creators", period: "01/11/2024 - 30/11/2024", generatedBy: "Admin", generatedAt: new Date("2024-12-01T11:00:00"), status: "sent", format: "pdf" },
];

export function ReportGeneratorModal({ open, onOpenChange }: ReportGeneratorModalProps) {
  const [activeTab, setActiveTab] = useState("generate");
  const [selectedTypes, setSelectedTypes] = useState<string[]>(["executive"]);
  const [period, setPeriod] = useState("month");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [format, setFormat] = useState("pdf");
  const [options, setOptions] = useState({
    comparison: true,
    graphs: true,
    segmentation: false,
    top10: true,
    sendEmail: false,
  });
  const [emailRecipient, setEmailRecipient] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Scheduled reports state
  const [scheduledReports, setScheduledReports] = useState(mockScheduledReports);
  const [showAddSchedule, setShowAddSchedule] = useState(false);
  const [newSchedule, setNewSchedule] = useState({
    type: "executive",
    frequency: "weekly",
    day: "Segunda",
    time: "08:00",
    recipients: "",
    format: "pdf",
  });

  const toggleReportType = (typeId: string) => {
    setSelectedTypes(prev =>
      prev.includes(typeId)
        ? prev.filter(t => t !== typeId)
        : [...prev, typeId]
    );
  };

  const toggleOption = (option: keyof typeof options) => {
    setOptions(prev => ({ ...prev, [option]: !prev[option] }));
  };

  const handleGenerate = async () => {
    if (selectedTypes.length === 0) {
      toast.error("Selecione pelo menos um tipo de relatório");
      return;
    }

    setIsGenerating(true);

    try {
      // Build request payload
      const payload = {
        reportTypes: selectedTypes,
        period,
        dateRange: period === "custom" && dateRange?.from ? {
          from: dateRange.from.toISOString(),
          to: dateRange.to?.toISOString() || new Date().toISOString(),
        } : undefined,
        options: {
          comparison: options.comparison,
          top10: options.top10,
          segmentation: options.segmentation,
        },
      };

      // Call edge function
      const { data: reportData, error } = await supabase.functions.invoke("generate-report", {
        body: payload,
      });

      if (error) {
        throw new Error(error.message || "Erro ao gerar relatório");
      }

      // Generate file based on format
      switch (format) {
        case "pdf":
          await generatePDF(reportData, selectedTypes);
          break;
        case "csv":
          generateCSV(reportData, selectedTypes);
          break;
        case "excel":
          await generateExcel(reportData, selectedTypes);
          break;
        case "json":
          generateJSON(reportData);
          break;
      }

      toast.success(`Relatório ${format.toUpperCase()} gerado com sucesso!`);

      if (options.sendEmail && emailRecipient) {
        toast.info(`Funcionalidade de envio por email será implementada em breve`);
      }
    } catch (error) {
      console.error("Error generating report:", error);
      toast.error(error instanceof Error ? error.message : "Erro ao gerar relatório");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAddSchedule = () => {
    const recipients = newSchedule.recipients.split(",").map(e => e.trim()).filter(Boolean);
    if (recipients.length === 0) {
      toast.error("Adicione pelo menos um destinatário");
      return;
    }

    setScheduledReports(prev => [
      ...prev,
      {
        id: String(Date.now()),
        ...newSchedule,
        recipients,
        active: true,
      },
    ]);
    setShowAddSchedule(false);
    setNewSchedule({
      type: "executive",
      frequency: "weekly",
      day: "Segunda",
      time: "08:00",
      recipients: "",
      format: "pdf",
    });
    toast.success("Agendamento criado com sucesso");
  };

  const toggleScheduleActive = (id: string) => {
    setScheduledReports(prev =>
      prev.map(s => s.id === id ? { ...s, active: !s.active } : s)
    );
  };

  const deleteSchedule = (id: string) => {
    setScheduledReports(prev => prev.filter(s => s.id !== id));
    toast.success("Agendamento removido");
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "generated":
        return <Badge variant="secondary" className="bg-green-100 text-green-700"><Check className="w-3 h-3 mr-1" />Gerado</Badge>;
      case "sent":
        return <Badge variant="secondary" className="bg-blue-100 text-blue-700"><Mail className="w-3 h-3 mr-1" />Enviado</Badge>;
      case "error":
        return <Badge variant="destructive"><X className="w-3 h-3 mr-1" />Erro</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getReportTypeLabel = (typeId: string) => {
    return reportTypes.find(t => t.id === typeId)?.label || typeId;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Gerador de Relatórios
          </DialogTitle>
          <DialogDescription>
            Gere relatórios detalhados, configure envios automáticos e acesse o histórico
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
          <TabsList className="grid w-full grid-cols-3 flex-shrink-0">
            <TabsTrigger value="generate">Gerar Relatório</TabsTrigger>
            <TabsTrigger value="scheduled">Agendados</TabsTrigger>
            <TabsTrigger value="history">Histórico</TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1 mt-4 pr-4">
            <TabsContent value="generate" className="mt-0 space-y-6 pb-4">
              {/* Report Types */}
              <div>
                <h4 className="font-medium mb-3">Tipo de Relatório</h4>
                <div className="grid grid-cols-2 gap-2">
                  {reportTypes.map((type) => {
                    const Icon = type.icon;
                    const isSelected = selectedTypes.includes(type.id);
                    return (
                      <div
                        key={type.id}
                        onClick={() => toggleReportType(type.id)}
                        className={cn(
                          "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
                          isSelected
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50"
                        )}
                      >
                        <Checkbox checked={isSelected} />
                        <Icon className="w-4 h-4 text-muted-foreground" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{type.label}</p>
                          <p className="text-xs text-muted-foreground truncate">{type.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <Separator />

              {/* Period */}
              <div>
                <h4 className="font-medium mb-3">Período</h4>
                <RadioGroup value={period} onValueChange={setPeriod} className="grid grid-cols-3 gap-2">
                  {periodOptions.map((opt) => (
                    <div key={opt.id} className="flex items-center space-x-2">
                      <RadioGroupItem value={opt.id} id={opt.id} />
                      <Label htmlFor={opt.id} className="text-sm cursor-pointer">{opt.label}</Label>
                    </div>
                  ))}
                </RadioGroup>

                {period === "custom" && (
                  <div className="mt-3">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="justify-start text-left font-normal w-full">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {dateRange?.from ? (
                            dateRange.to ? (
                              <>
                                {formatDate(dateRange.from, "dd/MM/yyyy", { locale: ptBR })} - {formatDate(dateRange.to, "dd/MM/yyyy", { locale: ptBR })}
                              </>
                            ) : (
                              formatDate(dateRange.from, "dd/MM/yyyy", { locale: ptBR })
                            )
                          ) : (
                            "Selecionar período"
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="range"
                          selected={dateRange}
                          onSelect={setDateRange}
                          numberOfMonths={2}
                          className="pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                )}
              </div>

              <Separator />

              {/* Format */}
              <div>
                <h4 className="font-medium mb-3">Formato</h4>
                <RadioGroup value={format} onValueChange={setFormat} className="grid grid-cols-2 gap-2">
                  {formatOptions.map((opt) => {
                    const Icon = opt.icon;
                    return (
                      <div
                        key={opt.id}
                        className={cn(
                          "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
                          format === opt.id
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50"
                        )}
                        onClick={() => setFormat(opt.id)}
                      >
                        <RadioGroupItem value={opt.id} id={`format-${opt.id}`} />
                        <Icon className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <Label htmlFor={`format-${opt.id}`} className="text-sm font-medium cursor-pointer">{opt.label}</Label>
                          <p className="text-xs text-muted-foreground">{opt.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </RadioGroup>
              </div>

              <Separator />

              {/* Additional Options */}
              <div>
                <h4 className="font-medium mb-3">Opções Adicionais</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="comparison"
                      checked={options.comparison}
                      onCheckedChange={() => toggleOption("comparison")}
                    />
                    <Label htmlFor="comparison" className="text-sm cursor-pointer">Incluir comparação com período anterior</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="graphs"
                      checked={options.graphs}
                      onCheckedChange={() => toggleOption("graphs")}
                      disabled={format === "csv" || format === "json"}
                    />
                    <Label htmlFor="graphs" className={cn("text-sm cursor-pointer", (format === "csv" || format === "json") && "text-muted-foreground")}>
                      Incluir gráficos
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="segmentation"
                      checked={options.segmentation}
                      onCheckedChange={() => toggleOption("segmentation")}
                    />
                    <Label htmlFor="segmentation" className="text-sm cursor-pointer">Incluir detalhamento por segmento</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="top10"
                      checked={options.top10}
                      onCheckedChange={() => toggleOption("top10")}
                    />
                    <Label htmlFor="top10" className="text-sm cursor-pointer">Incluir top 10 creators/produtos</Label>
                  </div>
                  <div className="col-span-2 space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="sendEmail"
                        checked={options.sendEmail}
                        onCheckedChange={() => toggleOption("sendEmail")}
                      />
                      <Label htmlFor="sendEmail" className="text-sm cursor-pointer">Enviar por email ao gerar</Label>
                    </div>
                    {options.sendEmail && (
                      <Input
                        placeholder="email@exemplo.com"
                        value={emailRecipient}
                        onChange={(e) => setEmailRecipient(e.target.value)}
                        className="max-w-sm"
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* Preview Section */}
              {showPreview && (
                <>
                  <Separator />
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Eye className="w-4 h-4" />
                        Preview do Relatório
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-muted/50 rounded-lg p-4 text-sm space-y-2">
                        <p><strong>Tipos:</strong> {selectedTypes.map(t => getReportTypeLabel(t)).join(", ") || "Nenhum selecionado"}</p>
                        <p><strong>Período:</strong> {periodOptions.find(p => p.id === period)?.label}</p>
                        <p><strong>Formato:</strong> {formatOptions.find(f => f.id === format)?.label}</p>
                        <p><strong>Opções:</strong> {[
                          options.comparison && "Comparação",
                          options.graphs && "Gráficos",
                          options.segmentation && "Segmentação",
                          options.top10 && "Top 10",
                        ].filter(Boolean).join(", ") || "Nenhuma"}</p>
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}

              {/* Actions */}
              <div className="flex items-center justify-between pt-4">
                <Button variant="outline" onClick={() => setShowPreview(!showPreview)}>
                  <Eye className="w-4 h-4 mr-2" />
                  {showPreview ? "Ocultar Preview" : "Ver Preview"}
                </Button>
                <Button onClick={handleGenerate} disabled={isGenerating || selectedTypes.length === 0}>
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Gerando...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 mr-2" />
                      Gerar Relatório
                    </>
                  )}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="scheduled" className="mt-0 space-y-4">
              {/* Add Schedule Form */}
              {showAddSchedule ? (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Novo Agendamento</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Tipo de Relatório</Label>
                        <Select value={newSchedule.type} onValueChange={(v) => setNewSchedule(s => ({ ...s, type: v }))}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {reportTypes.map(t => (
                              <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Frequência</Label>
                        <Select value={newSchedule.frequency} onValueChange={(v) => setNewSchedule(s => ({ ...s, frequency: v }))}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="daily">Diário</SelectItem>
                            <SelectItem value="weekly">Semanal</SelectItem>
                            <SelectItem value="monthly">Mensal</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {newSchedule.frequency === "weekly" && (
                        <div className="space-y-2">
                          <Label>Dia da Semana</Label>
                          <Select value={newSchedule.day} onValueChange={(v) => setNewSchedule(s => ({ ...s, day: v }))}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"].map(d => (
                                <SelectItem key={d} value={d}>{d}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                      {newSchedule.frequency === "monthly" && (
                        <div className="space-y-2">
                          <Label>Dia do Mês</Label>
                          <Select value={newSchedule.day} onValueChange={(v) => setNewSchedule(s => ({ ...s, day: v }))}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Array.from({ length: 28 }, (_, i) => i + 1).map(d => (
                                <SelectItem key={d} value={String(d)}>{d}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                      <div className="space-y-2">
                        <Label>Horário</Label>
                        <Input
                          type="time"
                          value={newSchedule.time}
                          onChange={(e) => setNewSchedule(s => ({ ...s, time: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Formato</Label>
                        <Select value={newSchedule.format} onValueChange={(v) => setNewSchedule(s => ({ ...s, format: v }))}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {formatOptions.map(f => (
                              <SelectItem key={f.id} value={f.id}>{f.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Destinatários (separados por vírgula)</Label>
                      <Input
                        placeholder="email1@exemplo.com, email2@exemplo.com"
                        value={newSchedule.recipients}
                        onChange={(e) => setNewSchedule(s => ({ ...s, recipients: e.target.value }))}
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setShowAddSchedule(false)}>Cancelar</Button>
                      <Button onClick={handleAddSchedule}>Criar Agendamento</Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Button onClick={() => setShowAddSchedule(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Agendamento
                </Button>
              )}

              {/* Scheduled Reports List */}
              <div className="space-y-3">
                {scheduledReports.map((schedule) => (
                  <Card key={schedule.id} className={cn(!schedule.active && "opacity-60")}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={cn(
                            "w-10 h-10 rounded-full flex items-center justify-center",
                            schedule.active ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                          )}>
                            <Clock className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="font-medium">{getReportTypeLabel(schedule.type)}</p>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <span className="capitalize">{schedule.frequency}</span>
                              {schedule.day !== "-" && <span>• {schedule.day}</span>}
                              <span>• {schedule.time}</span>
                              <span>• {schedule.format.toUpperCase()}</span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              <Mail className="w-3 h-3 inline mr-1" />
                              {schedule.recipients.join(", ")}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={schedule.active ? "default" : "secondary"}>
                            {schedule.active ? "Ativo" : "Pausado"}
                          </Badge>
                          <Button variant="ghost" size="icon" onClick={() => toast.info("Gerando relatório...")}>
                            <RefreshCw className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => toggleScheduleActive(schedule.id)}>
                            {schedule.active ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                          </Button>
                          <Button variant="ghost" size="icon">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => deleteSchedule(schedule.id)}>
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {scheduledReports.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>Nenhum relatório agendado</p>
                    <p className="text-sm">Crie um agendamento para receber relatórios automaticamente</p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="history" className="mt-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data/Hora</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Período</TableHead>
                    <TableHead>Gerado por</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockReportHistory.map((report) => (
                    <TableRow key={report.id}>
                      <TableCell className="text-sm">
                        {formatDate(report.generatedAt, "dd/MM/yyyy HH:mm", { locale: ptBR })}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{getReportTypeLabel(report.type)}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{report.period}</TableCell>
                      <TableCell className="text-sm">{report.generatedBy}</TableCell>
                      <TableCell>{getStatusBadge(report.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => toast.info("Iniciando download...")}>
                            <Download className="w-4 h-4" />
                          </Button>
                          {report.status !== "error" && (
                            <Button variant="ghost" size="icon" onClick={() => toast.success("Email reenviado")}>
                              <Send className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {mockReportHistory.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Nenhum relatório gerado ainda</p>
                </div>
              )}
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
