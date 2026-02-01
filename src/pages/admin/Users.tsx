import { useState, useMemo } from "react";
import { UserDetailsModal } from "@/components/admin/UserDetailsModal";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Search,
  MoreHorizontal,
  Eye,
  Ban,
  Mail,
  Shield,
  Download,
  X,
  Users,
  UserCheck,
  TrendingUp,
  TrendingDown,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  CalendarIcon,
  BadgeCheck,
  Pencil,
  RefreshCw,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { DateRange } from "react-day-picker";
import { useAdminUsers, useAdminUsersStats, AdminUser } from "@/hooks/useAdminUsers";
import { useAdminExport } from "@/hooks/useAdminExport";

type SortField = "name" | "handle" | "role" | "status" | "plan" | "created_at" | "last_access";
type SortDirection = "asc" | "desc";

export default function AdminUsers() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [planFilter, setPlanFilter] = useState("all");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [sortField, setSortField] = useState<SortField>("created_at");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [selectedUserForModal, setSelectedUserForModal] = useState<{
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
  } | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const itemsPerPage = 20;

  // Fetch real data
  const { data: usersData, isLoading, refetch } = useAdminUsers({
    search,
    statusFilter,
    roleFilter,
    planFilter,
    dateRange: dateRange?.from ? { from: dateRange.from, to: dateRange.to } : undefined,
    verifiedOnly,
    sortField,
    sortDirection,
    page: currentPage,
    pageSize: itemsPerPage,
  });

  const { data: stats, isLoading: statsLoading } = useAdminUsersStats();
  const { exportUsers, isExporting } = useAdminExport();

  const users = usersData?.users || [];
  const totalPages = usersData?.totalPages || 1;

  const handleViewDetails = (user: AdminUser) => {
    setSelectedUserForModal({
      id: user.id,
      name: user.name,
      email: user.email,
      handle: user.handle,
      avatar: user.avatar_url || "",
      role: user.role,
      status: user.status,
      plan: user.plan === "creator_pro" ? "pro" : user.plan as "free" | "pro" | "brand",
      verified: user.is_verified,
      createdAt: new Date(user.created_at),
      lastAccess: new Date(user.last_access),
    });
    setIsModalOpen(true);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const handleSelectAll = () => {
    if (selectedUsers.size === users.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(users.map((u) => u.id)));
    }
  };

  const handleSelectUser = (userId: string) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUsers(newSelected);
  };

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setRoleFilter("all");
    setPlanFilter("all");
    setDateRange(undefined);
    setVerifiedOnly(false);
    setCurrentPage(1);
  };

  const hasActiveFilters = search || statusFilter !== "all" || roleFilter !== "all" || planFilter !== "all" || dateRange || verifiedOnly;

  const getRoleBadge = (role: string) => {
    const variants: Record<string, { class: string; label: string }> = {
      admin: { class: "bg-red-500/10 text-red-500 border-red-500/20", label: "Admin" },
      creator: { class: "bg-purple-500/10 text-purple-500 border-purple-500/20", label: "Creator" },
      brand: { class: "bg-orange-500/10 text-orange-500 border-orange-500/20", label: "Brand" },
      follower: { class: "bg-blue-500/10 text-blue-500 border-blue-500/20", label: "Follower" },
    };
    const variant = variants[role] || variants.follower;
    return <Badge variant="outline" className={variant.class}>{variant.label}</Badge>;
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { class: string; label: string }> = {
      active: { class: "bg-green-500/10 text-green-500 border-green-500/20", label: "Ativo" },
      inactive: { class: "bg-gray-500/10 text-gray-500 border-gray-500/20", label: "Inativo" },
      suspended: { class: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20", label: "Suspenso" },
      banned: { class: "bg-red-500/10 text-red-500 border-red-500/20", label: "Banido" },
    };
    const variant = variants[status] || variants.inactive;
    return <Badge variant="outline" className={variant.class}>{variant.label}</Badge>;
  };

  const getPlanBadge = (plan: string) => {
    const variants: Record<string, { class: string; label: string }> = {
      free: { class: "bg-gray-500/10 text-gray-500 border-gray-500/20", label: "Free" },
      creator_pro: { class: "bg-purple-500/10 text-purple-500 border-purple-500/20", label: "Creator Pro" },
      brand: { class: "bg-orange-500/10 text-orange-500 border-orange-500/20", label: "Brand" },
    };
    const variant = variants[plan] || variants.free;
    return <Badge variant="outline" className={variant.class}>{variant.label}</Badge>;
  };

  const SortHeader = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <Button
      variant="ghost"
      size="sm"
      className="-ml-3 h-8 data-[state=open]:bg-accent"
      onClick={() => handleSort(field)}
    >
      {children}
      {sortField === field ? (
        sortDirection === "asc" ? (
          <ArrowUp className="ml-2 h-4 w-4" />
        ) : (
          <ArrowDown className="ml-2 h-4 w-4" />
        )
      ) : (
        <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />
      )}
    </Button>
  );

  return (
    <>
      <div className="space-y-6">
        <Card className="border-admin-border">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-3">
              {/* Search */}
              <div className="relative flex-1 min-w-[250px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome, email ou handle..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-9"
                />
              </div>

              {/* Status Filter */}
              <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setCurrentPage(1); }}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos Status</SelectItem>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="inactive">Inativo</SelectItem>
                  <SelectItem value="suspended">Suspenso</SelectItem>
                  <SelectItem value="banned">Banido</SelectItem>
                </SelectContent>
              </Select>

              {/* Role Filter */}
              <Select value={roleFilter} onValueChange={(v) => { setRoleFilter(v); setCurrentPage(1); }}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos Roles</SelectItem>
                  <SelectItem value="follower">Follower</SelectItem>
                  <SelectItem value="creator">Creator</SelectItem>
                  <SelectItem value="brand">Brand</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>

              {/* Plan Filter */}
              <Select value={planFilter} onValueChange={(v) => { setPlanFilter(v); setCurrentPage(1); }}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Plano" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos Planos</SelectItem>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="creator_pro">Creator Pro</SelectItem>
                  <SelectItem value="brand">Brand</SelectItem>
                </SelectContent>
              </Select>

              {/* Date Range */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-[200px] justify-start text-left font-normal", !dateRange && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange?.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, "dd/MM/yy")} - {format(dateRange.to, "dd/MM/yy")}
                        </>
                      ) : (
                        format(dateRange.from, "dd/MM/yyyy")
                      )
                    ) : (
                      "Cadastrado entre"
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange?.from}
                    selected={dateRange}
                    onSelect={(range) => { setDateRange(range); setCurrentPage(1); }}
                    numberOfMonths={2}
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>

              {/* Verified Only */}
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={verifiedOnly}
                  onCheckedChange={(checked) => { setVerifiedOnly(checked as boolean); setCurrentPage(1); }}
                />
                <span className="text-sm whitespace-nowrap">Apenas verificados</span>
              </label>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 ml-auto">
                <Button variant="outline" size="sm" onClick={() => refetch()}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Atualizar
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => exportUsers()}
                  disabled={isExporting}
                >
                  <Download className="h-4 w-4 mr-2" />
                  {isExporting ? "Exportando..." : "Exportar CSV"}
                </Button>
                {hasActiveFilters && (
                  <Button variant="ghost" size="sm" onClick={clearFilters}>
                    <X className="h-4 w-4 mr-2" />
                    Limpar filtros
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-muted-foreground">Total de Usuários</p>
                  {statsLoading ? (
                    <Skeleton className="h-8 w-24 mt-1" />
                  ) : (
                    <p className="text-2xl font-bold">{stats?.total.toLocaleString('pt-BR')}</p>
                  )}
                </div>
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Users className="h-5 w-5 text-primary" />
                </div>
              </div>
              {!statsLoading && stats && (
                <div className="flex items-center gap-1 mt-2 text-sm">
                  {stats.totalDelta >= 0 ? (
                    <TrendingUp className="h-4 w-4 text-green-500" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-500" />
                  )}
                  <span className={stats.totalDelta >= 0 ? "text-green-500" : "text-red-500"}>
                    {stats.totalDelta >= 0 ? "+" : ""}{stats.totalDelta}%
                  </span>
                  <span className="text-muted-foreground">vs mês anterior</span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-muted-foreground">Usuários Ativos</p>
                  {statsLoading ? (
                    <Skeleton className="h-8 w-24 mt-1" />
                  ) : (
                    <p className="text-2xl font-bold">{stats?.active.toLocaleString('pt-BR')}</p>
                  )}
                </div>
                <div className="p-2 bg-green-500/10 rounded-lg">
                  <UserCheck className="h-5 w-5 text-green-500" />
                </div>
              </div>
              {!statsLoading && stats && (
                <div className="flex items-center gap-1 mt-2 text-sm">
                  {stats.activeDelta >= 0 ? (
                    <TrendingUp className="h-4 w-4 text-green-500" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-500" />
                  )}
                  <span className={stats.activeDelta >= 0 ? "text-green-500" : "text-red-500"}>
                    {stats.activeDelta >= 0 ? "+" : ""}{stats.activeDelta}%
                  </span>
                  <span className="text-muted-foreground">vs mês anterior</span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-muted-foreground">Conversão Pro</p>
                  {statsLoading ? (
                    <Skeleton className="h-8 w-24 mt-1" />
                  ) : (
                    <p className="text-2xl font-bold">{stats?.conversionRate}%</p>
                  )}
                </div>
                <div className="p-2 bg-purple-500/10 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-purple-500" />
                </div>
              </div>
              {!statsLoading && stats && (
                <div className="flex items-center gap-1 mt-2 text-sm">
                  {stats.conversionDelta >= 0 ? (
                    <TrendingUp className="h-4 w-4 text-green-500" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-500" />
                  )}
                  <span className={stats.conversionDelta >= 0 ? "text-green-500" : "text-red-500"}>
                    {stats.conversionDelta >= 0 ? "+" : ""}{stats.conversionDelta}pp
                  </span>
                  <span className="text-muted-foreground">vs mês anterior</span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-muted-foreground">Churn Rate</p>
                  {statsLoading ? (
                    <Skeleton className="h-8 w-24 mt-1" />
                  ) : (
                    <p className="text-2xl font-bold">{stats?.churnRate}%</p>
                  )}
                </div>
                <div className="p-2 bg-red-500/10 rounded-lg">
                  <TrendingDown className="h-5 w-5 text-red-500" />
                </div>
              </div>
              {!statsLoading && stats && (
                <div className="flex items-center gap-1 mt-2 text-sm">
                  {stats.churnDelta <= 0 ? (
                    <TrendingDown className="h-4 w-4 text-green-500" />
                  ) : (
                    <TrendingUp className="h-4 w-4 text-red-500" />
                  )}
                  <span className={stats.churnDelta <= 0 ? "text-green-500" : "text-red-500"}>
                    {stats.churnDelta}pp
                  </span>
                  <span className="text-muted-foreground">vs mês anterior</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Bulk Actions */}
        {selectedUsers.size > 0 && (
          <Card className="border-primary/50 bg-primary/5">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm">
                  <span className="font-medium">{selectedUsers.size}</span> usuário(s) selecionado(s)
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Mail className="h-4 w-4 mr-2" />
                    Enviar Email
                  </Button>
                  <Button variant="outline" size="sm">
                    <Shield className="h-4 w-4 mr-2" />
                    Alterar Role
                  </Button>
                  <Button variant="destructive" size="sm">
                    <Ban className="h-4 w-4 mr-2" />
                    Suspender
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Users Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={users.length > 0 && selectedUsers.size === users.length}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead>
                    <SortHeader field="name">Usuário</SortHeader>
                  </TableHead>
                  <TableHead>
                    <SortHeader field="role">Role</SortHeader>
                  </TableHead>
                  <TableHead>
                    <SortHeader field="status">Status</SortHeader>
                  </TableHead>
                  <TableHead>
                    <SortHeader field="plan">Plano</SortHeader>
                  </TableHead>
                  <TableHead>
                    <SortHeader field="created_at">Cadastro</SortHeader>
                  </TableHead>
                  <TableHead>
                    <SortHeader field="last_access">Último Acesso</SortHeader>
                  </TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 10 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-4" /></TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Skeleton className="h-10 w-10 rounded-full" />
                          <div className="space-y-1">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-3 w-24" />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                    </TableRow>
                  ))
                ) : users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                      {hasActiveFilters 
                        ? "Nenhum usuário encontrado com os filtros aplicados." 
                        : "Nenhum usuário cadastrado ainda."}
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedUsers.has(user.id)}
                          onCheckedChange={() => handleSelectUser(user.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={user.avatar_url || undefined} />
                            <AvatarFallback>{user.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-medium">{user.name}</span>
                              {user.is_verified && (
                                <Tooltip>
                                  <TooltipTrigger>
                                    <BadgeCheck className="h-4 w-4 text-blue-500" />
                                  </TooltipTrigger>
                                  <TooltipContent>Verificado</TooltipContent>
                                </Tooltip>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">@{user.handle}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{getRoleBadge(user.role)}</TableCell>
                      <TableCell>{getStatusBadge(user.status)}</TableCell>
                      <TableCell>{getPlanBadge(user.plan)}</TableCell>
                      <TableCell>
                        <Tooltip>
                          <TooltipTrigger className="text-sm">
                            {format(new Date(user.created_at), "dd/MM/yyyy")}
                          </TooltipTrigger>
                          <TooltipContent>
                            {format(new Date(user.created_at), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                          </TooltipContent>
                        </Tooltip>
                      </TableCell>
                      <TableCell>
                        <Tooltip>
                          <TooltipTrigger className="text-sm text-muted-foreground">
                            {formatDistanceToNow(new Date(user.last_access), { addSuffix: true, locale: ptBR })}
                          </TooltipTrigger>
                          <TooltipContent>
                            {format(new Date(user.last_access), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                          </TooltipContent>
                        </Tooltip>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewDetails(user)}>
                              <Eye className="h-4 w-4 mr-2" />
                              Ver detalhes
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Pencil className="h-4 w-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>
                              <Mail className="h-4 w-4 mr-2" />
                              Enviar email
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive">
                              <Ban className="h-4 w-4 mr-2" />
                              Suspender conta
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Mostrando {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, usersData?.totalCount || 0)} de {usersData?.totalCount || 0} usuários
            </p>
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
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
                    <PaginationItem key={pageNum}>
                      <PaginationLink
                        onClick={() => setCurrentPage(pageNum)}
                        isActive={currentPage === pageNum}
                        className="cursor-pointer"
                      >
                        {pageNum}
                      </PaginationLink>
                    </PaginationItem>
                  );
                })}
                <PaginationItem>
                  <PaginationNext 
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </div>

      <UserDetailsModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        user={selectedUserForModal}
      />
    </>
  );
}
