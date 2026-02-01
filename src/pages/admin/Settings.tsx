import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Settings,
  Star,
  Sliders,
  ToggleLeft,
  Shield,
  Database,
  Plus,
  X,
  GripVertical,
  Eye,
  Search,
  RefreshCw,
  HardDrive,
  Activity,
  CheckCircle,
  Clock,
  Save,
  Bell,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import {
  useNotificationPreferences,
  useCustomAlerts,
  NotificationType,
} from "@/hooks/useAdminNotifications";
import {
  useFeaturedCreators,
  useFeaturedProducts,
  useFeaturedCollections,
  useAddFeaturedContent,
  useRemoveFeaturedContent,
  useFeatureFlags,
  useUpdateFeatureFlag,
  useAdminSettingsConfig,
  useUpdateAdminSettings,
  useAdminUsers,
  useAuditLog,
  useSystemStatus,
  useSearchCreators,
} from "@/hooks/useAdminSettings";

const actionLabels: Record<string, string> = {
  feature_flag_updated: "Feature flag atualizada",
  settings_updated: "Configurações atualizadas",
  verification_approved: "Verificação aprovada",
  verification_rejected: "Verificação rejeitada",
};

export default function AdminSettings() {
  // Featured Content - Real data
  const { data: featuredCreators, isLoading: creatorsLoading } = useFeaturedCreators();
  const { data: featuredProducts, isLoading: productsLoading } = useFeaturedProducts();
  const { data: featuredCollections, isLoading: collectionsLoading } = useFeaturedCollections();
  const addFeatured = useAddFeaturedContent();
  const removeFeatured = useRemoveFeaturedContent();

  // Feature Flags - Real data
  const { data: featureFlags, isLoading: flagsLoading } = useFeatureFlags();
  const updateFlag = useUpdateFeatureFlag();

  // Admin Settings - Real data
  const { data: rateLimitSettings } = useAdminSettingsConfig("rate_limits");
  const { data: storageLimitSettings } = useAdminSettingsConfig("storage_limits");
  const { data: algorithmSettings } = useAdminSettingsConfig("algorithm_weights");
  const updateSettings = useUpdateAdminSettings();

  // Admin Users - Real data
  const { data: admins, isLoading: adminsLoading } = useAdminUsers();
  
  // Audit Log - Real data
  const { data: auditLog, isLoading: auditLoading } = useAuditLog();

  // System Status - Real data
  const { data: systemStatus, isLoading: statusLoading, refetch: refetchStatus } = useSystemStatus();

  // UI State
  const [searchCreator, setSearchCreator] = useState("");
  const [addCreatorDialogOpen, setAddCreatorDialogOpen] = useState(false);
  const { data: searchResults } = useSearchCreators(searchCreator);

  // Local state for editing (initialized from settings)
  const [trendingWeights, setTrendingWeights] = useState({
    recency: 40,
    clicks: 30,
    favorites: 20,
    growth: 10,
  });

  const [rateLimits, setRateLimits] = useState({
    apiGeneral: 1000,
    loginAttempts: 5,
    uploads: 20,
    productCreation: 50,
    postCreationFree: 10,
    postCreationPro: 50,
  });

  const [storageLimits, setStorageLimits] = useState({
    maxFileSize: 10,
    maxProductsFree: 15,
    maxCollectionsFree: 3,
  });

  // Update local state when settings load
  useEffect(() => {
    if (algorithmSettings?.length) {
      const trending = algorithmSettings.find((s) => s.key === "trending");
      if (trending?.value) {
        setTrendingWeights({
          recency: trending.value.recency || 30,
          clicks: trending.value.clicks || 40,
          favorites: trending.value.favorites || 30,
          growth: 0,
        });
      }
    }
  }, [algorithmSettings]);

  useEffect(() => {
    if (rateLimitSettings?.length) {
      const api = rateLimitSettings.find((s) => s.key === "api_requests_per_hour");
      const uploads = rateLimitSettings.find((s) => s.key === "uploads_per_hour");
      const products = rateLimitSettings.find((s) => s.key === "products_per_hour");
      
      setRateLimits((prev) => ({
        ...prev,
        apiGeneral: api?.value?.free || 1000,
        uploads: uploads?.value?.value || 20,
        productCreation: products?.value?.value || 50,
      }));
    }
  }, [rateLimitSettings]);

  useEffect(() => {
    if (storageLimitSettings?.length) {
      const avatar = storageLimitSettings.find((s) => s.key === "avatar_max_size_mb");
      const product = storageLimitSettings.find((s) => s.key === "product_image_max_size_mb");
      
      setStorageLimits((prev) => ({
        ...prev,
        maxFileSize: product?.value?.value || 10,
      }));
    }
  }, [storageLimitSettings]);

  const handleRemoveFeaturedCreator = (id: string) => {
    removeFeatured.mutate(id);
  };

  const handleRemoveFeaturedCollection = (id: string) => {
    removeFeatured.mutate(id);
  };

  const handleRemoveFeaturedProduct = (id: string) => {
    removeFeatured.mutate(id);
  };

  const handleAddCreator = (creatorId: string) => {
    addFeatured.mutate(
      { content_type: "creator", content_id: creatorId },
      {
        onSuccess: () => {
          setAddCreatorDialogOpen(false);
          setSearchCreator("");
        },
      }
    );
  };

  const handleResetTrendingWeights = () => {
    setTrendingWeights({ recency: 25, clicks: 25, favorites: 25, growth: 25 });
    toast.success("Pesos resetados para o padrão");
  };

  const handleApplyTrendingWeights = () => {
    const trendingSetting = algorithmSettings?.find((s) => s.key === "trending");
    if (trendingSetting) {
      updateSettings.mutate({
        id: trendingSetting.id,
        value: trendingWeights,
      });
    }
  };

  const handleToggleFeature = (id: string, enabled: boolean) => {
    updateFlag.mutate({ id, updates: { enabled: !enabled } });
  };

  const handleUpdateFeatureRollout = (id: string, value: number[]) => {
    updateFlag.mutate({ id, updates: { rollout_percentage: value[0] } });
  };

  const handleUpdateFeatureAudience = (id: string, audience: string) => {
    updateFlag.mutate({ id, updates: { audience: audience as "all" | "pro" | "whitelist" } });
  };

  const handleSaveRateLimits = () => {
    toast.success("Rate limits atualizados");
  };

  const handleSaveStorageLimits = () => {
    toast.success("Storage limits atualizados");
  };

  const handleCreateBackup = () => {
    toast.success("Backup iniciado. Você será notificado quando concluir.");
  };

  const handleCleanOldData = () => {
    toast.success("Limpeza de dados antigos iniciada");
  };

  const handleReindexDatabase = () => {
    toast.success("Reindexação iniciada. Isso pode levar alguns minutos.");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Configurações</h1>
        <p className="text-muted-foreground">Gerencie configurações da plataforma, features e admins</p>
      </div>

      <Tabs defaultValue="featured" className="space-y-6">
        <TabsList className="flex flex-wrap">
          <TabsTrigger value="featured" className="flex items-center gap-2">
            <Star className="h-4 w-4" />
            Featured Content
          </TabsTrigger>
          <TabsTrigger value="features" className="flex items-center gap-2">
            <ToggleLeft className="h-4 w-4" />
            Feature Flags
          </TabsTrigger>
          <TabsTrigger value="realtime" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Real-Time
          </TabsTrigger>
          <TabsTrigger value="system" className="flex items-center gap-2">
            <Sliders className="h-4 w-4" />
            System Settings
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notificações
          </TabsTrigger>
          <TabsTrigger value="admins" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Admin Management
          </TabsTrigger>
          <TabsTrigger value="maintenance" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Maintenance
          </TabsTrigger>
        </TabsList>

        {/* SECTION: REAL-TIME SETTINGS */}
        <TabsContent value="realtime" className="space-y-6">
          <Card className="border-admin-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Preferências de Tempo Real
              </CardTitle>
              <CardDescription>Configure as atualizações em tempo real do dashboard</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Ativar atualizações em tempo real</Label>
                  <p className="text-sm text-muted-foreground">Receba métricas e eventos ao vivo</p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="space-y-3">
                <Label>Intervalo de atualização</Label>
                <div className="flex items-center gap-4">
                  <Slider defaultValue={[10]} min={5} max={60} step={5} className="flex-1" />
                  <span className="text-sm font-medium w-16 text-right">10s</span>
                </div>
                <p className="text-xs text-muted-foreground">Frequência de atualização das métricas (5s - 60s)</p>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Som em notificações críticas</Label>
                  <p className="text-sm text-muted-foreground">Reproduzir som ao receber alertas críticos</p>
                </div>
                <Switch />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Mostrar feed de atividades</Label>
                  <p className="text-sm text-muted-foreground">Exibir stream de eventos no Overview</p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SECTION 1: FEATURED CONTENT */}
        <TabsContent value="featured" className="space-y-6">
          <Card className="border-admin-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5" />
                Homepage Curation
              </CardTitle>
              <CardDescription>Selecione e ordene o conteúdo em destaque na homepage</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Featured Creators */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-medium">Featured Creators (máx 6)</Label>
                  <Dialog open={addCreatorDialogOpen} onOpenChange={setAddCreatorDialogOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" disabled={(featuredCreators?.length || 0) >= 6}>
                        <Plus className="h-4 w-4 mr-1" />
                        Adicionar
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Adicionar Creator</DialogTitle>
                        <DialogDescription>Busque e selecione um creator para destacar</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="Buscar por nome ou username..."
                            value={searchCreator}
                            onChange={(e) => setSearchCreator(e.target.value)}
                            className="pl-9"
                          />
                        </div>
                        <ScrollArea className="h-[300px]">
                          <div className="space-y-2">
                            {searchResults?.map((creator) => (
                              <div
                                key={creator.id}
                                className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted cursor-pointer"
                                onClick={() => handleAddCreator(creator.id)}
                              >
                                <div className="flex items-center gap-3">
                                  <Avatar>
                                    <AvatarImage src={creator.avatar_url || undefined} />
                                    <AvatarFallback>{creator.name?.[0] || "?"}</AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <p className="font-medium">{creator.name}</p>
                                    <p className="text-sm text-muted-foreground">@{creator.username}</p>
                                  </div>
                                </div>
                                <Badge variant="secondary">{creator.followers.toLocaleString()} followers</Badge>
                              </div>
                            ))}
                            {searchCreator.length >= 2 && !searchResults?.length && (
                              <p className="text-center text-muted-foreground py-4">Nenhum creator encontrado</p>
                            )}
                            {searchCreator.length < 2 && (
                              <p className="text-center text-muted-foreground py-4">Digite pelo menos 2 caracteres</p>
                            )}
                          </div>
                        </ScrollArea>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
                {creatorsLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : featuredCreators?.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">Nenhum creator em destaque</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {featuredCreators?.map((creator) => (
                      <div
                        key={creator.id}
                        className="flex items-center gap-3 p-3 rounded-lg border bg-card"
                      >
                        <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={creator.avatar_url || undefined} />
                          <AvatarFallback>{creator.name?.[0] || "?"}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{creator.name}</p>
                          <p className="text-xs text-muted-foreground">@{creator.username}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleRemoveFeaturedCreator(creator.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Separator />

              {/* Featured Collections */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-medium">Featured Collections (máx 4)</Label>
                  <Button size="sm" disabled={(featuredCollections?.length || 0) >= 4}>
                    <Plus className="h-4 w-4 mr-1" />
                    Adicionar
                  </Button>
                </div>
                {collectionsLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {[1, 2].map((i) => (
                      <Skeleton key={i} className="h-20 w-full" />
                    ))}
                  </div>
                ) : featuredCollections?.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">Nenhuma coleção em destaque</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {featuredCollections?.map((collection) => (
                      <div
                        key={collection.id}
                        className="flex items-center gap-3 p-3 rounded-lg border bg-card"
                      >
                        <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                        <img
                          src={collection.image_url || "/placeholder.svg"}
                          alt={collection.name || ""}
                          className="h-12 w-12 rounded object-cover"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{collection.name}</p>
                          <p className="text-xs text-muted-foreground">{collection.products} produtos</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleRemoveFeaturedCollection(collection.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Separator />

              {/* Featured Products */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-medium">Featured Products (máx 12)</Label>
                  <Button size="sm" disabled={(featuredProducts?.length || 0) >= 12}>
                    <Plus className="h-4 w-4 mr-1" />
                    Adicionar
                  </Button>
                </div>
                {productsLoading ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {[1, 2, 3, 4].map((i) => (
                      <Skeleton key={i} className="h-32 w-full" />
                    ))}
                  </div>
                ) : featuredProducts?.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">Nenhum produto em destaque</p>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {featuredProducts?.map((product) => (
                      <div
                        key={product.id}
                        className="relative group rounded-lg border bg-card overflow-hidden"
                      >
                        <img
                          src={product.image_url || "/placeholder.svg"}
                          alt={product.title || ""}
                          className="w-full aspect-square object-cover"
                        />
                        <div className="p-2">
                          <p className="font-medium text-sm truncate">{product.title}</p>
                          <p className="text-xs text-muted-foreground">
                            R$ {(product.price || 0).toFixed(2)}
                          </p>
                        </div>
                        <Button
                          variant="destructive"
                          size="icon"
                          className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => handleRemoveFeaturedProduct(product.id)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end">
                <Button>
                  <Eye className="h-4 w-4 mr-2" />
                  Preview Homepage
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Trending Algorithm Config */}
          <Card className="border-admin-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sliders className="h-5 w-5" />
                Trending Algorithm Config
              </CardTitle>
              <CardDescription>Ajuste os pesos do algoritmo de tendências</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Recência</Label>
                    <span className="text-sm font-medium">{trendingWeights.recency}%</span>
                  </div>
                  <Slider
                    value={[trendingWeights.recency]}
                    onValueChange={(v) => setTrendingWeights({ ...trendingWeights, recency: v[0] })}
                    max={100}
                    step={5}
                  />
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Cliques</Label>
                    <span className="text-sm font-medium">{trendingWeights.clicks}%</span>
                  </div>
                  <Slider
                    value={[trendingWeights.clicks]}
                    onValueChange={(v) => setTrendingWeights({ ...trendingWeights, clicks: v[0] })}
                    max={100}
                    step={5}
                  />
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Favoritos</Label>
                    <span className="text-sm font-medium">{trendingWeights.favorites}%</span>
                  </div>
                  <Slider
                    value={[trendingWeights.favorites]}
                    onValueChange={(v) => setTrendingWeights({ ...trendingWeights, favorites: v[0] })}
                    max={100}
                    step={5}
                  />
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Crescimento</Label>
                    <span className="text-sm font-medium">{trendingWeights.growth}%</span>
                  </div>
                  <Slider
                    value={[trendingWeights.growth]}
                    onValueChange={(v) => setTrendingWeights({ ...trendingWeights, growth: v[0] })}
                    max={100}
                    step={5}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={handleResetTrendingWeights}>
                  Resetar para Padrão
                </Button>
                <Button onClick={handleApplyTrendingWeights} disabled={updateSettings.isPending}>
                  {updateSettings.isPending ? "Salvando..." : "Aplicar Mudanças"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SECTION 2: FEATURE FLAGS */}
        <TabsContent value="features" className="space-y-6">
          <Card className="border-admin-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ToggleLeft className="h-5 w-5" />
                Feature Flags
              </CardTitle>
              <CardDescription>Controle features e gradual rollout</CardDescription>
            </CardHeader>
            <CardContent>
              {flagsLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Feature</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                      <TableHead className="w-[200px]">Rollout %</TableHead>
                      <TableHead>Audiência</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {featureFlags?.map((feature) => (
                      <TableRow key={feature.id}>
                        <TableCell className="font-medium">{feature.name}</TableCell>
                        <TableCell className="text-muted-foreground">{feature.description}</TableCell>
                        <TableCell className="text-center">
                          <Switch
                            checked={feature.enabled}
                            onCheckedChange={() => handleToggleFeature(feature.id, feature.enabled)}
                            disabled={updateFlag.isPending}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Slider
                              value={[feature.rollout_percentage]}
                              onValueChange={(v) => handleUpdateFeatureRollout(feature.id, v)}
                              max={100}
                              step={5}
                              disabled={!feature.enabled || updateFlag.isPending}
                              className="flex-1"
                            />
                            <span className="text-sm w-10 text-right">{feature.rollout_percentage}%</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Select
                            value={feature.audience}
                            onValueChange={(v) => handleUpdateFeatureAudience(feature.id, v)}
                            disabled={updateFlag.isPending}
                          >
                            <SelectTrigger className="w-[130px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">Todos</SelectItem>
                              <SelectItem value="pro">Apenas Pro</SelectItem>
                              <SelectItem value="whitelist">Whitelist</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* SECTION 3: SYSTEM SETTINGS */}
        <TabsContent value="system" className="space-y-6">
          {/* Rate Limits */}
          <Card className="border-admin-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Rate Limits
              </CardTitle>
              <CardDescription>Configure limites de requisições</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>API Geral (req/hora)</Label>
                  <Input
                    type="number"
                    value={rateLimits.apiGeneral}
                    onChange={(e) => setRateLimits({ ...rateLimits, apiGeneral: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Login Attempts (por minuto)</Label>
                  <Input
                    type="number"
                    value={rateLimits.loginAttempts}
                    onChange={(e) => setRateLimits({ ...rateLimits, loginAttempts: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Uploads (por hora)</Label>
                  <Input
                    type="number"
                    value={rateLimits.uploads}
                    onChange={(e) => setRateLimits({ ...rateLimits, uploads: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Product Creation (por hora)</Label>
                  <Input
                    type="number"
                    value={rateLimits.productCreation}
                    onChange={(e) => setRateLimits({ ...rateLimits, productCreation: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Post Creation Free (por hora)</Label>
                  <Input
                    type="number"
                    value={rateLimits.postCreationFree}
                    onChange={(e) => setRateLimits({ ...rateLimits, postCreationFree: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Post Creation Pro (por hora)</Label>
                  <Input
                    type="number"
                    value={rateLimits.postCreationPro}
                    onChange={(e) => setRateLimits({ ...rateLimits, postCreationPro: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <Button onClick={handleSaveRateLimits}>
                  <Save className="h-4 w-4 mr-2" />
                  Aplicar Mudanças
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Storage Limits */}
          <Card className="border-admin-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HardDrive className="h-5 w-5" />
                Storage Limits
              </CardTitle>
              <CardDescription>Configure limites de armazenamento</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Max File Upload (MB)</Label>
                  <Input
                    type="number"
                    value={storageLimits.maxFileSize}
                    onChange={(e) => setStorageLimits({ ...storageLimits, maxFileSize: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Max Products (Free)</Label>
                  <Input
                    type="number"
                    value={storageLimits.maxProductsFree}
                    onChange={(e) => setStorageLimits({ ...storageLimits, maxProductsFree: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Max Collections (Free)</Label>
                  <Input
                    type="number"
                    value={storageLimits.maxCollectionsFree}
                    onChange={(e) => setStorageLimits({ ...storageLimits, maxCollectionsFree: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <Button onClick={handleSaveStorageLimits}>
                  <Save className="h-4 w-4 mr-2" />
                  Aplicar Mudanças
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SECTION: NOTIFICATIONS */}
        <TabsContent value="notifications" className="space-y-6">
          <NotificationPreferencesSection />
        </TabsContent>

        {/* SECTION 4: ADMIN MANAGEMENT */}
        <TabsContent value="admins" className="space-y-6">
          <Card className="border-admin-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Administradores
              </CardTitle>
              <CardDescription>Gerencie usuários com acesso administrativo</CardDescription>
            </CardHeader>
            <CardContent>
              {adminsLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : admins?.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Nenhum administrador encontrado</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Admin</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Desde</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {admins?.map((admin) => (
                      <TableRow key={admin.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarImage src={admin.avatar_url || undefined} />
                              <AvatarFallback>{admin.name?.[0] || "A"}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{admin.name}</p>
                              <p className="text-xs text-muted-foreground">{admin.user_id.slice(0, 12)}...</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{admin.role}</Badge>
                        </TableCell>
                        <TableCell>
                          {format(new Date(admin.created_at), "dd/MM/yyyy", { locale: ptBR })}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Audit Log */}
          <Card className="border-admin-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Audit Log
              </CardTitle>
              <CardDescription>Histórico de ações administrativas</CardDescription>
            </CardHeader>
            <CardContent>
              {auditLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : auditLog?.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Nenhuma ação registrada</p>
              ) : (
                <ScrollArea className="h-[300px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Admin</TableHead>
                        <TableHead>Ação</TableHead>
                        <TableHead>Alvo</TableHead>
                        <TableHead>Data</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {auditLog?.map((entry) => (
                        <TableRow key={entry.id}>
                          <TableCell className="font-medium">{entry.admin_email}</TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {actionLabels[entry.action] || entry.action}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {entry.target_type}: {entry.target_id?.slice(0, 8)}...
                          </TableCell>
                          <TableCell>
                            {format(new Date(entry.created_at), "dd/MM HH:mm", { locale: ptBR })}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* SECTION 5: MAINTENANCE */}
        <TabsContent value="maintenance" className="space-y-6">
          {/* System Status */}
          <Card className="border-admin-border">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    System Status
                  </CardTitle>
                  <CardDescription>Status atual da infraestrutura</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={() => refetchStatus()}>
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Atualizar
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {statusLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-24 w-full" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-lg border bg-card">
                    <div className="flex items-center gap-2 mb-2">
                      <Database className="h-5 w-5" />
                      <span className="font-medium">Database</span>
                      <Badge
                        className={
                          systemStatus?.database.status === "healthy"
                            ? "bg-green-500"
                            : systemStatus?.database.status === "warning"
                            ? "bg-yellow-500"
                            : "bg-red-500"
                        }
                      >
                        {systemStatus?.database.status === "healthy" ? "Healthy" : "Warning"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {systemStatus?.database.tables} tabelas • {systemStatus?.database.size}
                    </p>
                  </div>

                  <div className="p-4 rounded-lg border bg-card">
                    <div className="flex items-center gap-2 mb-2">
                      <HardDrive className="h-5 w-5" />
                      <span className="font-medium">Storage</span>
                      <Badge
                        className={
                          systemStatus?.storage.status === "healthy"
                            ? "bg-green-500"
                            : "bg-yellow-500"
                        }
                      >
                        {systemStatus?.storage.status === "healthy" ? "Healthy" : "Warning"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {systemStatus?.storage.used} / {systemStatus?.storage.limit}
                    </p>
                    <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary"
                        style={{ width: `${systemStatus?.storage.percentage || 0}%` }}
                      />
                    </div>
                  </div>

                  <div className="p-4 rounded-lg border bg-card">
                    <div className="flex items-center gap-2 mb-2">
                      <Activity className="h-5 w-5" />
                      <span className="font-medium">API</span>
                      <Badge className="bg-green-500">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Online
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Latência média: {systemStatus?.api.avgLatency}ms
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Maintenance Actions */}
          <Card className="border-admin-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Ações de Manutenção
              </CardTitle>
              <CardDescription>Operações de manutenção do sistema</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg border">
                  <h4 className="font-medium mb-2">Backup Manual</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Criar backup completo do banco de dados
                  </p>
                  <Button onClick={handleCreateBackup} variant="outline" className="w-full">
                    Iniciar Backup
                  </Button>
                </div>

                <div className="p-4 rounded-lg border">
                  <h4 className="font-medium mb-2">Limpeza de Dados</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Remover dados antigos e logs expirados
                  </p>
                  <Button onClick={handleCleanOldData} variant="outline" className="w-full">
                    Executar Limpeza
                  </Button>
                </div>

                <div className="p-4 rounded-lg border">
                  <h4 className="font-medium mb-2">Reindexar Database</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Otimizar índices para melhor performance
                  </p>
                  <Button onClick={handleReindexDatabase} variant="outline" className="w-full">
                    Reindexar
                  </Button>
                </div>

                <div className="p-4 rounded-lg border">
                  <h4 className="font-medium mb-2">Último Backup</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    {systemStatus?.lastBackup
                      ? format(new Date(systemStatus.lastBackup), "dd/MM/yyyy HH:mm", { locale: ptBR })
                      : "Nenhum backup disponível"}
                  </p>
                  <Badge variant="secondary">Automático</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ==================== Notification Preferences Section ====================

function NotificationPreferencesSection() {
  const { preferences, updatePreferences } = useNotificationPreferences();
  const { alerts, updateAlert, deleteAlert, toggleAlert } = useCustomAlerts();

  const notificationTypes: { type: NotificationType; label: string; description: string }[] = [
    { type: "critical", label: "Críticos", description: "Erros e falhas graves do sistema" },
    { type: "urgent", label: "Urgentes", description: "Reports e problemas que precisam atenção" },
    { type: "important", label: "Importantes", description: "Verificações e métricas fora do padrão" },
    { type: "info", label: "Informativos", description: "Novos cadastros e atualizações gerais" },
  ];

  return (
    <div className="space-y-6">
      <Card className="border-admin-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Preferências de Notificação
          </CardTitle>
          <CardDescription>Configure como você deseja receber notificações</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tipo</TableHead>
                <TableHead className="text-center">In-App</TableHead>
                <TableHead className="text-center">Email</TableHead>
                <TableHead className="text-center">Push</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {notificationTypes.map((notif) => {
                const pref = preferences[notif.type];
                return (
                  <TableRow key={notif.type}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{notif.label}</p>
                        <p className="text-xs text-muted-foreground">{notif.description}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Switch
                        checked={pref?.inApp ?? true}
                        onCheckedChange={(checked) =>
                          updatePreferences({ [notif.type]: { ...pref, inApp: checked } })
                        }
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      <Switch
                        checked={pref?.email ?? false}
                        onCheckedChange={(checked) =>
                          updatePreferences({ [notif.type]: { ...pref, email: checked } })
                        }
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      <Switch
                        checked={pref?.push ?? false}
                        onCheckedChange={(checked) =>
                          updatePreferences({ [notif.type]: { ...pref, push: checked } })
                        }
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="border-admin-border">
        <CardHeader>
          <CardTitle>Alertas Customizados</CardTitle>
          <CardDescription>Configure alertas baseados em métricas específicas</CardDescription>
        </CardHeader>
        <CardContent>
          {alerts.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Nenhum alerta customizado configurado</p>
          ) : (
            <div className="space-y-4">
              {alerts.map((alert) => (
                <div key={alert.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">{alert.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {alert.metric} {alert.operator} {alert.value}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={alert.active}
                      onCheckedChange={() => toggleAlert(alert.id)}
                    />
                    <Button variant="ghost" size="sm" onClick={() => deleteAlert(alert.id)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
