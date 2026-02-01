import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Search,
  MoreHorizontal,
  Eye,
  Trash2,
  AlertTriangle,
  ShoppingBag,
  Image as ImageIcon,
  FolderOpen,
  MousePointerClick,
  Heart,
  TrendingUp,
  TrendingDown,
  Ticket,
  Archive,
  Star,
  Download,
  ChevronLeft,
  ChevronRight,
  CalendarIcon,
  Filter,
  Package,
  X,
  Edit,
  ExternalLink,
  MapPin,
  Hash,
  User,
  Lock,
  Globe,
  GripVertical,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { ProductPreviewModal } from "@/components/admin/ProductPreviewModal";
import { PostPreviewModal } from "@/components/admin/PostPreviewModal";
import { CollectionPreviewModal } from "@/components/admin/CollectionPreviewModal";
import { PRODUCT_CATEGORIES } from "@/lib/validations/product";
import { 
  useAdminProducts, 
  useAdminPosts, 
  useAdminCollections, 
  useContentStats,
  AdminProduct,
  AdminPost,
  AdminCollection,
} from "@/hooks/useAdminContent";
import { useAdminExport } from "@/hooks/useAdminExport";

export default function AdminContent() {
  const [tab, setTab] = useState("products");
  
  // Product states
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [storeFilter, setStoreFilter] = useState("all");
  const [sortBy, setSortBy] = useState("recent");
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [previewProduct, setPreviewProduct] = useState<AdminProduct | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const itemsPerPage = 50;

  // Post states
  const [postSearch, setPostSearch] = useState("");
  const [postPinFilter, setPostPinFilter] = useState("all");
  const [postSortBy, setPostSortBy] = useState("recent");
  const [postDateRange, setPostDateRange] = useState<{ from?: Date; to?: Date }>({});
  const [postHashtagFilter, setPostHashtagFilter] = useState("");
  const [previewPost, setPreviewPost] = useState<AdminPost | null>(null);
  const [showPostFilters, setShowPostFilters] = useState(false);

  // Collection states
  const [collectionSearch, setCollectionSearch] = useState("");
  const [collectionTypeFilter, setCollectionTypeFilter] = useState("all");
  const [collectionPrivacyFilter, setCollectionPrivacyFilter] = useState("all");
  const [collectionSortBy, setCollectionSortBy] = useState("recent");
  const [previewCollection, setPreviewCollection] = useState<AdminCollection | null>(null);
  const [collectionCurrentPage, setCollectionCurrentPage] = useState(1);
  const [featuredCollectionsList, setFeaturedCollectionsList] = useState<AdminCollection[]>([]);
  const [draggedItem, setDraggedItem] = useState<string | null>(null);

  // Fetch real data from hooks
  const { data: productsData, isLoading: productsLoading, error: productsError } = useAdminProducts({
    search,
    statusFilter,
    typeFilter,
    categoryFilter,
    storeFilter,
    sortBy,
    dateRange,
    page: currentPage,
    pageSize: itemsPerPage,
  });

  const { data: postsData, isLoading: postsLoading, error: postsError } = useAdminPosts({
    search: postSearch,
    page: 1,
    pageSize: 50,
  });

  const { data: collectionsData, isLoading: collectionsLoading, error: collectionsError } = useAdminCollections({
    search: collectionSearch,
    page: collectionCurrentPage,
    pageSize: itemsPerPage,
  });

  const { data: contentStats, isLoading: statsLoading } = useContentStats();
  const { exportProducts, exportPosts, exportCollections, isExporting } = useAdminExport();

  // Extract data from hooks
  const products = productsData?.products || [];
  const totalProducts = productsData?.totalCount || 0;
  const totalPages = productsData?.totalPages || 1;

  const posts = postsData?.posts || [];
  const totalPosts = postsData?.totalCount || 0;

  const collections = collectionsData?.collections || [];
  const totalCollections = collectionsData?.totalCount || 0;
  const collectionTotalPages = collectionsData?.totalPages || 1;

  // Stats from real data
  const stats = contentStats || {
    products: { total: 0, published: 0, draft: 0, archived: 0, withCoupon: 0, avgClicks: 0 },
    posts: { total: 0, withPins: 0, avgPins: "0", avgCTR: "0" },
    collections: { total: 0, creator: 0, follower: 0, avgProducts: "0", featured: 0 },
  };

  // Get unique stores from products
  const uniqueStores = useMemo(() => {
    const stores = new Set(products.map(p => p.store).filter(Boolean));
    return Array.from(stores).sort() as string[];
  }, [products]);

  // Filter posts client-side for pin filter
  const filteredPosts = useMemo(() => {
    let result = [...posts];

    if (postPinFilter === "with") {
      result = result.filter(p => p.pins.length > 0);
    } else if (postPinFilter === "without") {
      result = result.filter(p => p.pins.length === 0);
    }

    if (postHashtagFilter) {
      result = result.filter(p => p.hashtags.some(h => h.toLowerCase().includes(postHashtagFilter.toLowerCase())));
    }

    switch (postSortBy) {
      case "engagement":
        result.sort((a, b) => b.engagement_rate - a.engagement_rate);
        break;
      case "clicks":
        result.sort((a, b) => b.clicks - a.clicks);
        break;
      default:
        break;
    }

    return result;
  }, [posts, postPinFilter, postHashtagFilter, postSortBy]);

  // Filter collections client-side
  const filteredCollections = useMemo(() => {
    let result = [...collections];

    if (collectionTypeFilter !== "all") {
      result = result.filter(c => c.creator.type === collectionTypeFilter);
    }

    if (collectionPrivacyFilter !== "all") {
      result = result.filter(c => 
        collectionPrivacyFilter === "public" ? c.is_public : !c.is_public
      );
    }

    switch (collectionSortBy) {
      case "products":
        result.sort((a, b) => b.products.length - a.products.length);
        break;
      case "views":
        result.sort((a, b) => b.views - a.views);
        break;
      default:
        break;
    }

    return result;
  }, [collections, collectionTypeFilter, collectionPrivacyFilter, collectionSortBy]);

  const paginatedCollections = filteredCollections.slice(
    (collectionCurrentPage - 1) * itemsPerPage,
    collectionCurrentPage * itemsPerPage
  );

  const handleSelectAll = () => {
    if (selectedProducts.length === products.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(products.map(p => p.id));
    }
  };

  const handleSelectProduct = (id: string) => {
    setSelectedProducts(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setTypeFilter("all");
    setCategoryFilter("all");
    setStoreFilter("all");
    setDateRange({});
    setSortBy("recent");
  };

  const clearPostFilters = () => {
    setPostSearch("");
    setPostPinFilter("all");
    setPostHashtagFilter("");
    setPostDateRange({});
    setPostSortBy("recent");
  };

  const hasActivePostFilters = postPinFilter !== "all" || postHashtagFilter || postDateRange.from;

  const handleDragStart = (id: string) => {
    setDraggedItem(id);
  };

  const handleDragOver = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (draggedItem && draggedItem !== targetId) {
      const draggedIndex = featuredCollectionsList.findIndex(c => c.id === draggedItem);
      const targetIndex = featuredCollectionsList.findIndex(c => c.id === targetId);
      
      const newList = [...featuredCollectionsList];
      const [removed] = newList.splice(draggedIndex, 1);
      newList.splice(targetIndex, 0, removed);
      setFeaturedCollectionsList(newList);
    }
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
  };

  const toggleFeatured = (id: string, featured: boolean) => {
    if (featured) {
      const collection = collections.find(c => c.id === id);
      if (collection && !featuredCollectionsList.find(c => c.id === id)) {
        setFeaturedCollectionsList([...featuredCollectionsList, collection]);
      }
    } else {
      setFeaturedCollectionsList(featuredCollectionsList.filter(c => c.id !== id));
    }
  };

  const hasActiveFilters = statusFilter !== "all" || typeFilter !== "all" || 
    categoryFilter !== "all" || storeFilter !== "all" || dateRange.from || dateRange.to;

  const getStatusBadge = (status?: string, isPublished?: boolean) => {
    if (!isPublished && status !== "archived") {
      return <Badge variant="secondary">Draft</Badge>;
    }
    if (status === "archived") {
      return <Badge variant="outline">Arquivado</Badge>;
    }
    return <Badge className="bg-green-500/10 text-green-500 hover:bg-green-500/20 border-0">Publicado</Badge>;
  };

  const getTypeBadge = (type?: string) => {
    switch (type) {
      case "affiliate":
        return <Badge className="bg-blue-500/10 text-blue-500 border-0">Afiliado</Badge>;
      case "coupon":
        return <Badge className="bg-purple-500/10 text-purple-500 border-0">Cupom</Badge>;
      case "recommendation":
        return <Badge className="bg-amber-500/10 text-amber-500 border-0">Rec</Badge>;
      default:
        return null;
    }
  };

  // Loading skeleton
  const TableSkeleton = () => (
    <>
      {[...Array(10)].map((_, i) => (
        <TableRow key={i}>
          <TableCell><Skeleton className="h-4 w-4" /></TableCell>
          <TableCell>
            <div className="flex items-center gap-3">
              <Skeleton className="h-12 w-12 rounded" />
              <Skeleton className="h-4 w-32" />
            </div>
          </TableCell>
          <TableCell><Skeleton className="h-6 w-24" /></TableCell>
          <TableCell><Skeleton className="h-5 w-16" /></TableCell>
          <TableCell><Skeleton className="h-5 w-16" /></TableCell>
          <TableCell><Skeleton className="h-5 w-16" /></TableCell>
          <TableCell><Skeleton className="h-4 w-12" /></TableCell>
          <TableCell><Skeleton className="h-4 w-12" /></TableCell>
          <TableCell><Skeleton className="h-4 w-10" /></TableCell>
          <TableCell><Skeleton className="h-4 w-16" /></TableCell>
          <TableCell><Skeleton className="h-8 w-8" /></TableCell>
        </TableRow>
      ))}
    </>
  );

  // Empty state
  const EmptyState = ({ message, onClear }: { message: string; onClear?: () => void }) => (
    <TableRow>
      <TableCell colSpan={11} className="h-64">
        <div className="flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <Package className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="font-semibold mb-1">{message}</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Tente ajustar os filtros ou fazer uma busca diferente
          </p>
          {onClear && (
            <Button variant="outline" size="sm" onClick={onClear}>
              Limpar filtros
            </Button>
          )}
        </div>
      </TableCell>
    </TableRow>
  );

  // Error state
  if (productsError || postsError || collectionsError) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h3 className="font-semibold mb-2">Erro ao carregar conteúdo</h3>
          <p className="text-sm text-muted-foreground">
            {(productsError as Error)?.message || "Tente novamente mais tarde"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <Tabs value={tab} onValueChange={setTab}>
          <div className="flex items-center justify-between mb-6">
            <TabsList>
              <TabsTrigger value="products" className="gap-2">
                <ShoppingBag className="h-4 w-4" />
                Produtos
              </TabsTrigger>
              <TabsTrigger value="posts" className="gap-2">
                <ImageIcon className="h-4 w-4" />
                Posts
              </TabsTrigger>
              <TabsTrigger value="collections" className="gap-2">
                <FolderOpen className="h-4 w-4" />
                Coleções
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="products" className="space-y-6 mt-0">
            {/* Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <ShoppingBag className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Total Produtos</p>
                        {statsLoading ? (
                          <Skeleton className="h-8 w-16" />
                        ) : (
                          <p className="text-2xl font-bold">{stats.products.total.toLocaleString()}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-green-500/10">
                      <Eye className="h-5 w-5 text-green-500" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Publicados</p>
                      {statsLoading ? (
                        <Skeleton className="h-8 w-24" />
                      ) : (
                        <div className="flex items-baseline gap-2">
                          <p className="text-2xl font-bold">{stats.products.published}</p>
                          <p className="text-xs text-muted-foreground">
                            | {stats.products.draft} drafts | {stats.products.archived} arquivados
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-purple-500/10">
                        <Ticket className="h-5 w-5 text-purple-500" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Com Cupom</p>
                        {statsLoading ? (
                          <Skeleton className="h-8 w-12" />
                        ) : (
                          <p className="text-2xl font-bold">
                            {stats.products.total > 0 
                              ? ((stats.products.withCoupon / stats.products.total) * 100).toFixed(0) 
                              : 0}%
                          </p>
                        )}
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {stats.products.withCoupon} produtos
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-amber-500/10">
                        <MousePointerClick className="h-5 w-5 text-amber-500" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Média Clicks/Prod</p>
                        {statsLoading ? (
                          <Skeleton className="h-8 w-12" />
                        ) : (
                          <p className="text-2xl font-bold">{stats.products.avgClicks}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Filters */}
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-4">
                    <div className="relative flex-1 max-w-md">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Buscar por título, slug ou creator..."
                        value={search}
                        onChange={(e) => {
                          setSearch(e.target.value);
                          setCurrentPage(1);
                        }}
                        className="pl-9"
                      />
                    </div>

                    <Button
                      variant="outline"
                      onClick={() => setShowFilters(!showFilters)}
                      className={cn(hasActiveFilters && "border-primary text-primary")}
                    >
                      <Filter className="h-4 w-4 mr-2" />
                      Filtros
                      {hasActiveFilters && (
                        <Badge variant="secondary" className="ml-2 h-5 px-1.5">
                          {[statusFilter !== "all", typeFilter !== "all", categoryFilter !== "all", storeFilter !== "all", dateRange.from].filter(Boolean).length}
                        </Badge>
                      )}
                    </Button>

                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Ordenar por" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="recent">Mais Recentes</SelectItem>
                        <SelectItem value="clicks">Mais Clicados</SelectItem>
                        <SelectItem value="favorites">Mais Favoritados</SelectItem>
                        <SelectItem value="ctr">Maior CTR</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {showFilters && (
                    <div className="flex flex-wrap items-center gap-3 pt-2 border-t">
                      <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setCurrentPage(1); }}>
                        <SelectTrigger className="w-[140px]">
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos Status</SelectItem>
                          <SelectItem value="published">Publicados</SelectItem>
                          <SelectItem value="draft">Drafts</SelectItem>
                          <SelectItem value="archived">Arquivados</SelectItem>
                        </SelectContent>
                      </Select>

                      <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setCurrentPage(1); }}>
                        <SelectTrigger className="w-[140px]">
                          <SelectValue placeholder="Tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos Tipos</SelectItem>
                          <SelectItem value="affiliate">Afiliado</SelectItem>
                          <SelectItem value="coupon">Cupom</SelectItem>
                          <SelectItem value="recommendation">Recomendação</SelectItem>
                        </SelectContent>
                      </Select>

                      <Select value={categoryFilter} onValueChange={(v) => { setCategoryFilter(v); setCurrentPage(1); }}>
                        <SelectTrigger className="w-[160px]">
                          <SelectValue placeholder="Categoria" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todas Categorias</SelectItem>
                          {PRODUCT_CATEGORIES.map(cat => (
                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Select value={storeFilter} onValueChange={(v) => { setStoreFilter(v); setCurrentPage(1); }}>
                        <SelectTrigger className="w-[140px]">
                          <SelectValue placeholder="Loja" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todas Lojas</SelectItem>
                          {uniqueStores.map(store => (
                            <SelectItem key={store} value={store}>{store}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className={cn("w-[200px] justify-start text-left font-normal", !dateRange.from && "text-muted-foreground")}>
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {dateRange.from ? (
                              dateRange.to ? (
                                <>
                                  {format(dateRange.from, "dd/MM/yy")} - {format(dateRange.to, "dd/MM/yy")}
                                </>
                              ) : (
                                format(dateRange.from, "dd/MM/yyyy")
                              )
                            ) : (
                              "Período"
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="range"
                            selected={{ from: dateRange.from, to: dateRange.to }}
                            onSelect={(range) => {
                              setDateRange({ from: range?.from, to: range?.to });
                              setCurrentPage(1);
                            }}
                            locale={ptBR}
                            numberOfMonths={2}
                          />
                        </PopoverContent>
                      </Popover>

                      {hasActiveFilters && (
                        <Button variant="ghost" size="sm" onClick={clearFilters}>
                          <X className="h-4 w-4 mr-1" />
                          Limpar
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Bulk Actions */}
            {selectedProducts.length > 0 && (
              <Card className="border-primary bg-primary/5">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-medium">
                        {selectedProducts.length} produto{selectedProducts.length > 1 ? "s" : ""} selecionado{selectedProducts.length > 1 ? "s" : ""}
                      </span>
                      <Button variant="ghost" size="sm" onClick={() => setSelectedProducts([])}>
                        Desmarcar
                      </Button>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm">
                        <Archive className="h-4 w-4 mr-2" />
                        Arquivar
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => exportProducts({ dateRange })}
                        disabled={isExporting}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        {isExporting ? "Exportando..." : "Exportar"}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Products Table */}
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="w-12">
                        <Checkbox
                          checked={selectedProducts.length === products.length && products.length > 0}
                          onCheckedChange={handleSelectAll}
                        />
                      </TableHead>
                      <TableHead className="min-w-[250px]">Produto</TableHead>
                      <TableHead>Creator</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Clicks</TableHead>
                      <TableHead className="text-right">Favoritos</TableHead>
                      <TableHead className="text-right">CTR</TableHead>
                      <TableHead>Criado em</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {productsLoading ? (
                      <TableSkeleton />
                    ) : products.length === 0 ? (
                      <EmptyState 
                        message="Nenhum produto encontrado" 
                        onClear={hasActiveFilters ? clearFilters : undefined} 
                      />
                    ) : (
                      products.map((product) => (
                        <TableRow key={product.id}>
                          <TableCell>
                            <Checkbox
                              checked={selectedProducts.includes(product.id)}
                              onCheckedChange={() => handleSelectProduct(product.id)}
                            />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              {product.image_url ? (
                                <img
                                  src={product.image_url}
                                  alt=""
                                  className="w-12 h-12 rounded-lg object-cover"
                                />
                              ) : (
                                <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                                  <Package className="h-6 w-6 text-muted-foreground" />
                                </div>
                              )}
                              <div className="min-w-0">
                                <p className="font-medium truncate max-w-[180px]">{product.title}</p>
                                <p className="text-xs text-muted-foreground">{product.store || "—"}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Avatar className="h-6 w-6">
                                <AvatarImage src={product.profiles.avatar_url || undefined} />
                                <AvatarFallback>{product.profiles.name[0]}</AvatarFallback>
                              </Avatar>
                              <span className="text-sm text-muted-foreground">@{product.profiles.username}</span>
                            </div>
                          </TableCell>
                          <TableCell>{getTypeBadge(product.monetization_type)}</TableCell>
                          <TableCell>
                            <span className="text-sm text-muted-foreground">
                              {product.categories?.[0] || "—"}
                            </span>
                          </TableCell>
                          <TableCell>{getStatusBadge(product.status, product.is_published)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <MousePointerClick className="h-3.5 w-3.5 text-muted-foreground" />
                              <span>{product.click_count.toLocaleString()}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Heart className="h-3.5 w-3.5 text-muted-foreground" />
                              <span>{product.favorite_count.toLocaleString()}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-mono text-sm">
                            {product.ctr}%
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {format(new Date(product.created_at), "dd/MM/yy")}
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => setPreviewProduct(product)}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  Ver detalhes
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Editar
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <ExternalLink className="h-4 w-4 mr-2" />
                                  Ver no site
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem>
                                  <Archive className="h-4 w-4 mr-2" />
                                  Arquivar
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Star className="h-4 w-4 mr-2" />
                                  Destacar
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-destructive">
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Remover
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>

                {/* Pagination */}
                {totalProducts > 0 && (
                  <div className="flex items-center justify-between px-4 py-4 border-t">
                    <p className="text-sm text-muted-foreground">
                      Mostrando {(currentPage - 1) * itemsPerPage + 1} a {Math.min(currentPage * itemsPerPage, totalProducts)} de {totalProducts} produtos
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <div className="flex items-center gap-1">
                        {[...Array(Math.min(5, totalPages))].map((_, i) => {
                          let pageNum;
                          if (totalPages <= 5) {
                            pageNum = i + 1;
                          } else if (currentPage <= 3) {
                            pageNum = i + 1;
                          } else if (currentPage >= totalPages - 2) {
                            pageNum = totalPages - 4 + i;
                          } else {
                            pageNum = currentPage - 2 + i;
                          }
                          return (
                            <Button
                              key={i}
                              variant={currentPage === pageNum ? "default" : "outline"}
                              size="sm"
                              className="w-8"
                              onClick={() => setCurrentPage(pageNum)}
                            >
                              {pageNum}
                            </Button>
                          );
                        })}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="posts" className="space-y-6 mt-0">
            {/* Posts Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <ImageIcon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Posts</p>
                      {statsLoading ? (
                        <Skeleton className="h-8 w-12" />
                      ) : (
                        <p className="text-2xl font-bold">{stats.posts.total}</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-purple-500/10">
                      <MapPin className="h-5 w-5 text-purple-500" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Com Pins</p>
                      {statsLoading ? (
                        <Skeleton className="h-8 w-12" />
                      ) : (
                        <p className="text-2xl font-bold">
                          {stats.posts.total > 0 
                            ? ((stats.posts.withPins / stats.posts.total) * 100).toFixed(0)
                            : 0}%
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-amber-500/10">
                      <Hash className="h-5 w-5 text-amber-500" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Média Pins/Post</p>
                      {statsLoading ? (
                        <Skeleton className="h-8 w-12" />
                      ) : (
                        <p className="text-2xl font-bold">{stats.posts.avgPins}</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-green-500/10">
                      <MousePointerClick className="h-5 w-5 text-green-500" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">CTR Médio</p>
                      {statsLoading ? (
                        <Skeleton className="h-8 w-12" />
                      ) : (
                        <p className="text-2xl font-bold">{stats.posts.avgCTR}%</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Posts Filters */}
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-4">
                    <div className="relative flex-1 max-w-md">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input placeholder="Buscar por caption ou creator..." value={postSearch} onChange={(e) => setPostSearch(e.target.value)} className="pl-9" />
                    </div>
                    <Button variant="outline" onClick={() => setShowPostFilters(!showPostFilters)} className={cn(hasActivePostFilters && "border-primary text-primary")}>
                      <Filter className="h-4 w-4 mr-2" />Filtros
                    </Button>
                    <Select value={postSortBy} onValueChange={setPostSortBy}>
                      <SelectTrigger className="w-[180px]"><SelectValue placeholder="Ordenar por" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="recent">Mais Recentes</SelectItem>
                        <SelectItem value="engagement">Mais Engajados</SelectItem>
                        <SelectItem value="clicks">Mais Cliques</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {showPostFilters && (
                    <div className="flex flex-wrap items-center gap-3 pt-2 border-t">
                      <Select value={postPinFilter} onValueChange={setPostPinFilter}>
                        <SelectTrigger className="w-[140px]"><SelectValue placeholder="Pins" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos</SelectItem>
                          <SelectItem value="with">Com Pins</SelectItem>
                          <SelectItem value="without">Sem Pins</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input placeholder="Hashtag..." value={postHashtagFilter} onChange={(e) => setPostHashtagFilter(e.target.value)} className="w-[140px]" />
                      {hasActivePostFilters && <Button variant="ghost" size="sm" onClick={clearPostFilters}><X className="h-4 w-4 mr-1" />Limpar</Button>}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Posts Grid (Pinterest Style) */}
            {postsLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {[...Array(20)].map((_, i) => (
                  <Skeleton key={i} className="aspect-[3/4] rounded-xl" />
                ))}
              </div>
            ) : filteredPosts.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                  <ImageIcon className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="font-semibold mb-1">Nenhum post encontrado</h3>
                <p className="text-sm text-muted-foreground">
                  Tente ajustar os filtros
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {filteredPosts.slice(0, 40).map((post) => (
                  <div key={post.id} className="group relative rounded-xl overflow-hidden bg-muted">
                    <img src={post.image_url} alt="" className="w-full aspect-[3/4] object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="absolute top-3 left-3 flex items-center gap-2">
                        <Avatar className="h-7 w-7 border-2 border-white">
                          <AvatarImage src={post.creator.avatar || undefined} />
                          <AvatarFallback>{post.creator.name[0]}</AvatarFallback>
                        </Avatar>
                        <span className="text-white text-xs font-medium">@{post.creator.username}</span>
                      </div>
                      {post.pins.length > 0 && (
                        <Badge className="absolute top-3 right-3 bg-primary text-primary-foreground">{post.pins.length} pins</Badge>
                      )}
                      <div className="absolute bottom-0 inset-x-0 p-3">
                        <p className="text-white text-xs line-clamp-2 mb-2">{post.content}</p>
                        <div className="flex items-center justify-between text-white/80 text-xs">
                          <span className="flex items-center gap-1"><Eye className="h-3 w-3" />{post.views.toLocaleString()}</span>
                          <span className="flex items-center gap-1"><Heart className="h-3 w-3" />{post.saves}</span>
                          <span className="flex items-center gap-1"><MousePointerClick className="h-3 w-3" />{post.clicks}</span>
                        </div>
                        <div className="flex gap-1 mt-2">
                          <Button size="sm" variant="secondary" className="flex-1 h-7 text-xs" onClick={() => setPreviewPost(post)}>Ver</Button>
                          <Button size="sm" variant="ghost" className="h-7 px-2 text-white hover:text-white hover:bg-white/20"><Edit className="h-3 w-3" /></Button>
                          <Button size="sm" variant="ghost" className="h-7 px-2 text-white hover:text-destructive hover:bg-destructive/20"><Trash2 className="h-3 w-3" /></Button>
                        </div>
                      </div>
                    </div>
                    {post.reports > 0 && <Badge variant="destructive" className="absolute top-3 left-3 group-hover:hidden"><AlertTriangle className="h-3 w-3 mr-1" />{post.reports}</Badge>}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="collections" className="space-y-6 mt-0">
            {/* Collections Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <FolderOpen className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Coleções</p>
                      {statsLoading ? (
                        <Skeleton className="h-8 w-12" />
                      ) : (
                        <p className="text-2xl font-bold">{stats.collections.total}</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-500/10">
                      <User className="h-5 w-5 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">De Creators</p>
                      {statsLoading ? (
                        <Skeleton className="h-8 w-12" />
                      ) : (
                        <p className="text-2xl font-bold">{stats.collections.creator}</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-purple-500/10">
                      <Heart className="h-5 w-5 text-purple-500" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">De Followers</p>
                      {statsLoading ? (
                        <Skeleton className="h-8 w-12" />
                      ) : (
                        <p className="text-2xl font-bold">{stats.collections.follower}</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-amber-500/10">
                      <Package className="h-5 w-5 text-amber-500" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Média Produtos/Col</p>
                      {statsLoading ? (
                        <Skeleton className="h-8 w-12" />
                      ) : (
                        <p className="text-2xl font-bold">{stats.collections.avgProducts}</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Featured Collections */}
            {featuredCollectionsList.length > 0 && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Coleções Destacadas</CardTitle>
                      <CardDescription>Arraste para reordenar</CardDescription>
                    </div>
                    <Badge variant="secondary">{featuredCollectionsList.length} destacadas</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-4 overflow-x-auto pb-2">
                    {featuredCollectionsList.map((collection) => (
                      <div
                        key={collection.id}
                        draggable
                        onDragStart={() => handleDragStart(collection.id)}
                        onDragOver={(e) => handleDragOver(e, collection.id)}
                        onDragEnd={handleDragEnd}
                        className={cn(
                          "flex-shrink-0 w-40 rounded-lg border p-3 cursor-grab active:cursor-grabbing transition-transform",
                          draggedItem === collection.id && "opacity-50 scale-95"
                        )}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <GripVertical className="h-4 w-4 text-muted-foreground" />
                          <span className="text-xs font-medium truncate">{collection.name}</span>
                        </div>
                        {collection.thumbnail_url ? (
                          <img src={collection.thumbnail_url} alt="" className="w-full aspect-square rounded object-cover" />
                        ) : (
                          <div className="w-full aspect-square rounded bg-muted flex items-center justify-center">
                            <FolderOpen className="h-8 w-8 text-muted-foreground" />
                          </div>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full mt-2 h-7 text-xs"
                          onClick={() => toggleFeatured(collection.id, false)}
                        >
                          <X className="h-3 w-3 mr-1" />
                          Remover
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Collections Filters */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Buscar coleções..." value={collectionSearch} onChange={(e) => setCollectionSearch(e.target.value)} className="pl-9" />
                  </div>
                  <Select value={collectionTypeFilter} onValueChange={setCollectionTypeFilter}>
                    <SelectTrigger className="w-[140px]"><SelectValue placeholder="Tipo" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="creator">Creators</SelectItem>
                      <SelectItem value="follower">Followers</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={collectionPrivacyFilter} onValueChange={setCollectionPrivacyFilter}>
                    <SelectTrigger className="w-[140px]"><SelectValue placeholder="Privacidade" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      <SelectItem value="public">Públicas</SelectItem>
                      <SelectItem value="private">Privadas</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={collectionSortBy} onValueChange={setCollectionSortBy}>
                    <SelectTrigger className="w-[180px]"><SelectValue placeholder="Ordenar por" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="recent">Mais Recentes</SelectItem>
                      <SelectItem value="products">Mais Produtos</SelectItem>
                      <SelectItem value="views">Mais Views</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Collections Grid */}
            {collectionsLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {[...Array(12)].map((_, i) => (
                  <Skeleton key={i} className="aspect-square rounded-xl" />
                ))}
              </div>
            ) : paginatedCollections.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                  <FolderOpen className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="font-semibold mb-1">Nenhuma coleção encontrada</h3>
                <p className="text-sm text-muted-foreground">
                  Tente ajustar os filtros
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {paginatedCollections.map((collection) => (
                  <div key={collection.id} className="group relative rounded-xl overflow-hidden border bg-card">
                    <div className="aspect-square relative">
                      {collection.thumbnail_url ? (
                        <img src={collection.thumbnail_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-muted flex items-center justify-center">
                          <FolderOpen className="h-12 w-12 text-muted-foreground" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <Button size="sm" variant="secondary" onClick={() => setPreviewCollection(collection)}>
                          <Eye className="h-4 w-4 mr-1" />
                          Ver
                        </Button>
                      </div>
                      {collection.is_featured && (
                        <Badge className="absolute top-2 left-2 bg-amber-500">
                          <Star className="h-3 w-3 mr-1" />
                          Destaque
                        </Badge>
                      )}
                      <div className="absolute top-2 right-2">
                        {collection.is_public ? (
                          <Badge variant="secondary"><Globe className="h-3 w-3 mr-1" />Público</Badge>
                        ) : (
                          <Badge variant="outline"><Lock className="h-3 w-3 mr-1" />Privado</Badge>
                        )}
                      </div>
                    </div>
                    <div className="p-3">
                      <h4 className="font-medium truncate">{collection.name}</h4>
                      <div className="flex items-center gap-2 mt-2">
                        <Avatar className="h-5 w-5">
                          <AvatarImage src={collection.creator.avatar || undefined} />
                          <AvatarFallback>{collection.creator.name[0]}</AvatarFallback>
                        </Avatar>
                        <span className="text-xs text-muted-foreground">@{collection.creator.username}</span>
                        <Badge variant="outline" className="ml-auto text-xs">
                          {collection.products.length} produtos
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between mt-3 pt-3 border-t">
                        <span className="text-xs text-muted-foreground">{collection.views.toLocaleString()} views</span>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={featuredCollectionsList.some(c => c.id === collection.id)}
                            onCheckedChange={(checked) => toggleFeatured(collection.id, checked)}
                          />
                          <Label className="text-xs">Destacar</Label>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Collections Pagination */}
            {totalCollections > itemsPerPage && (
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Mostrando {(collectionCurrentPage - 1) * itemsPerPage + 1} a {Math.min(collectionCurrentPage * itemsPerPage, totalCollections)} de {totalCollections} coleções
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCollectionCurrentPage(p => Math.max(1, p - 1))}
                    disabled={collectionCurrentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCollectionCurrentPage(p => Math.min(collectionTotalPages, p + 1))}
                    disabled={collectionCurrentPage === collectionTotalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Preview Modals */}
      {previewProduct && (
        <ProductPreviewModal
          product={previewProduct}
          open={!!previewProduct}
          onOpenChange={() => setPreviewProduct(null)}
        />
      )}

      {previewPost && (
        <PostPreviewModal
          post={{
            ...previewPost,
            creator: {
              ...previewPost.creator,
              avatar: previewPost.creator.avatar || undefined,
            },
          }}
          open={!!previewPost}
          onOpenChange={() => setPreviewPost(null)}
        />
      )}

      {previewCollection && (
        <CollectionPreviewModal
          collection={{
            ...previewCollection,
            creator: {
              ...previewCollection.creator,
              avatar: previewCollection.creator.avatar || undefined,
            },
          }}
          open={!!previewCollection}
          onOpenChange={() => setPreviewCollection(null)}
        />
      )}
    </>
  );
}
