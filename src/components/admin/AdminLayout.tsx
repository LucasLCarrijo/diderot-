import { useState, useEffect, createContext, useContext } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  DollarSign,
  Target,
  BarChart3,
  ShoppingBag,
  Building2,
  AlertTriangle,
  Settings,
  Menu,
  X,
  LogOut,
  ChevronDown,
  FileText,
  Bell,
  Wifi,
  WifiOff,
  Search,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ReportGeneratorModal } from "@/components/admin/ReportGeneratorModal";
import { AdminNotificationBell } from "@/components/admin/AdminNotificationBell";
import { ThemeToggle } from "@/components/admin/ThemeToggle";
import { RealtimeIndicator } from "@/components/admin/RealtimeIndicator";
import { AdminBreadcrumb } from "@/components/admin/AdminBreadcrumb";
import { CommandPalette, useCommandPalette } from "@/components/admin/CommandPalette";
import { HealthCheck } from "@/components/admin/HealthCheck";
import { FavoriteStar, FavoritesList } from "@/components/admin/AdminFavorites";
import { ChangelogModal, useChangelog } from "@/components/admin/Changelog";
import { useAdminRealtime } from "@/hooks/useAdminRealtime";
import { useReportStats } from "@/hooks/useModeration";
import { useAdminNotifications } from "@/hooks/useAdminNotifications";
import logoDark from "@/assets/logo-diderot.svg";
import logoLight from "@/assets/logo-diderot-white.svg";

interface AdminLayoutProps {
  children: React.ReactNode;
}

const getNavItems = (pendingReports: number) => [
  { name: "Overview", href: "/admin", icon: LayoutDashboard },
  { name: "Usuários", href: "/admin/users", icon: Users },
  { name: "Métricas Financeiras", href: "/admin/financials", icon: DollarSign },
  { name: "North Star Metrics", href: "/admin/north-star", icon: Target },
  { name: "Analytics Avançado", href: "/admin/analytics", icon: BarChart3 },
  { name: "Produtos & Posts", href: "/admin/content", icon: ShoppingBag },
  { name: "Brands & Campanhas", href: "/admin/brands", icon: Building2 },
  { name: "Moderação", href: "/admin/moderation", icon: AlertTriangle, badge: pendingReports > 0 ? pendingReports : undefined },
  { name: "Configurações", href: "/admin/settings", icon: Settings },
];

// Create context for realtime data
const RealtimeContext = createContext<ReturnType<typeof useAdminRealtime> | null>(null);

export const useRealtime = () => {
  const context = useContext(RealtimeContext);
  if (!context) {
    throw new Error("useRealtime must be used within AdminLayout");
  }
  return context;
};

export function AdminLayout({ children }: AdminLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  // Real-time connection
  const realtime = useAdminRealtime();
  
  // Get real data for navigation badges
  const { data: reportStats } = useReportStats();
  const { unreadCount } = useAdminNotifications();
  
  // Generate nav items with real badge counts
  const NAV_ITEMS = getNavItems(reportStats?.pending || 0);
  
  // Command palette
  const { open: commandOpen, setOpen: setCommandOpen } = useCommandPalette();
  
  // Changelog
  const { hasNewChanges, showChangelog, setShowChangelog, openChangelog } = useChangelog();

  // Handle online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Update document title with real notification count
  useEffect(() => {
    document.title = unreadCount > 0 ? `(${unreadCount}) Diderot Admin` : "Diderot Admin";
  }, [unreadCount]);

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  const currentNavItem = NAV_ITEMS.find(item => 
    item.href === location.pathname || 
    (item.href !== "/admin" && location.pathname.startsWith(item.href))
  );
  const currentPageName = currentNavItem?.name || "Dashboard";
  const currentPageHref = currentNavItem?.href || "/admin";

  const SidebarContent = ({ onItemClick }: { onItemClick?: () => void }) => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-4 lg:p-6 border-b border-admin-border">
        <Link to="/admin" className="flex items-center gap-2" onClick={onItemClick}>
          <img src={logoDark} alt="Diderot" className="h-6 lg:h-7 dark:hidden" />
          <img src={logoLight} alt="Diderot" className="h-6 lg:h-7 hidden dark:block" />
          <Badge variant="secondary" className="bg-admin-accent text-admin-accent-foreground text-[10px]">
            Admin
          </Badge>
        </Link>
      </div>

      {/* Favorites */}
      <FavoritesList />

      {/* Navigation */}
      <nav className="flex-1 p-3 lg:p-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const isActive = location.pathname === item.href || 
            (item.href !== "/admin" && location.pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              to={item.href}
              onClick={onItemClick}
              className={cn(
                "flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-admin-accent text-admin-accent-foreground dark:bg-admin-accent dark:text-admin-accent-foreground"
                  : "text-admin-muted hover:bg-admin-accent/50 hover:text-admin-foreground hover:translate-x-1"
              )}
            >
              <div className="flex items-center gap-3">
                <Icon className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">{item.name}</span>
              </div>
              {item.badge && (
                <Badge className="bg-admin-warning text-white text-[10px] px-1.5 flex-shrink-0">
                  {item.badge}
                </Badge>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 lg:p-4 border-t border-admin-border space-y-2">
        {/* Changelog button */}
        <Button
          variant="ghost"
          className="w-full justify-start text-admin-muted hover:text-admin-foreground hover:bg-admin-accent/50 relative"
          onClick={() => {
            onItemClick?.();
            openChangelog();
          }}
        >
          <Sparkles className="h-4 w-4 mr-3" />
          O que há de novo
          {hasNewChanges && (
            <Badge className="ml-auto bg-purple-500 text-white text-[10px] px-1.5">
              Novo!
            </Badge>
          )}
        </Button>
        
        <Button
          variant="ghost"
          className="w-full justify-start text-admin-muted hover:text-admin-foreground hover:bg-admin-accent/50"
          onClick={() => {
            onItemClick?.();
            handleLogout();
          }}
        >
          <LogOut className="h-4 w-4 mr-3" />
          Sair
        </Button>
      </div>
    </div>
  );

  return (
    <RealtimeContext.Provider value={realtime}>
      <div className="min-h-screen bg-admin-background flex">
        {/* Offline indicator */}
        {!isOnline && (
          <div className="fixed top-0 left-0 right-0 bg-destructive text-destructive-foreground text-center py-1 text-sm z-50 flex items-center justify-center gap-2">
            <WifiOff className="h-4 w-4" />
            Você está offline
          </div>
        )}

        {/* Desktop Sidebar - Fixed 250px */}
        <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-admin-sidebar border-r border-admin-border">
          <SidebarContent />
        </aside>

        {/* Mobile Sidebar - Full screen overlay */}
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetContent 
            side="left" 
            className="w-full sm:w-80 p-0 bg-admin-sidebar border-admin-border"
          >
            <SidebarContent onItemClick={() => setSidebarOpen(false)} />
          </SheetContent>
        </Sheet>

        {/* Main Content */}
        <div className={cn("flex-1 lg:pl-64", !isOnline && "pt-7")}>
          {/* Header */}
          <header className="sticky top-0 z-40 bg-card border-b border-admin-border">
            <div className="flex items-center justify-between h-14 lg:h-16 px-3 lg:px-8">
              {/* Mobile Menu Button + Page Title */}
              <div className="flex items-center gap-3">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="lg:hidden h-9 w-9"
                  onClick={() => setSidebarOpen(true)}
                >
                  <Menu className="h-5 w-5" />
                </Button>

                <div className="hidden lg:block">
                  <AdminBreadcrumb />
                </div>

                {/* Page Title - Mobile only */}
                <h1 className="lg:hidden text-base font-semibold text-admin-foreground truncate">
                  {currentPageName}
                </h1>
                
                {/* Real-time Indicator */}
                <RealtimeIndicator 
                  status={realtime.status} 
                  lastUpdate={realtime.lastUpdate}
                  isPaused={realtime.isPaused}
                />
              </div>

              {/* Right side */}
              <div className="flex items-center gap-1 sm:gap-2">
                {/* Search / Command Palette Trigger */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCommandOpen(true)}
                      className="hidden md:flex items-center gap-2 text-muted-foreground"
                    >
                      <Search className="h-4 w-4" />
                      <span className="text-xs">Buscar...</span>
                      <kbd className="pointer-events-none ml-2 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
                        <span className="text-xs">⌘</span>K
                      </kbd>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Busca rápida (Cmd+K)</TooltipContent>
                </Tooltip>
                
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setCommandOpen(true)}
                  className="md:hidden h-9 w-9"
                >
                  <Search className="h-4 w-4" />
                </Button>

                {/* Favorite Star */}
                <FavoriteStar pageName={currentPageName} pageHref={currentPageHref} />

                {/* Generate Report Button */}
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setReportModalOpen(true)}
                  className="hidden md:flex"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Gerar Relatório
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setReportModalOpen(true)}
                  className="md:hidden h-9 w-9"
                >
                  <FileText className="h-4 w-4" />
                </Button>

                {/* Health Check */}
                <HealthCheck />

                {/* Theme Toggle */}
                <ThemeToggle />

                {/* Notifications */}
                <AdminNotificationBell />

                {/* User Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center gap-2 px-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user?.user_metadata?.avatar_url} />
                        <AvatarFallback className="bg-admin-accent text-admin-accent-foreground text-xs">
                          {user?.email?.[0]?.toUpperCase() || "A"}
                        </AvatarFallback>
                      </Avatar>
                      <span className="hidden lg:inline text-sm font-medium max-w-[100px] truncate">
                        {user?.user_metadata?.name || user?.email?.split("@")[0] || "Admin"}
                      </span>
                      <ChevronDown className="h-4 w-4 text-muted-foreground hidden sm:block" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem asChild>
                      <Link to="/">Voltar ao site</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={openChangelog}>
                      <Sparkles className="h-4 w-4 mr-2" />
                      O que há de novo
                      {hasNewChanges && (
                        <Badge className="ml-auto bg-purple-500/20 text-purple-500 border-0 text-[10px]">
                          Novo
                        </Badge>
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                      <LogOut className="h-4 w-4 mr-2" />
                      Sair
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </header>

          {/* Page Content */}
          <main className="p-3 sm:p-4 lg:p-8 animate-fade-in">
            {children}
          </main>
        </div>

        {/* Command Palette */}
        <CommandPalette open={commandOpen} onOpenChange={setCommandOpen} />

        {/* Report Generator Modal */}
        <ReportGeneratorModal open={reportModalOpen} onOpenChange={setReportModalOpen} />

        {/* Changelog Modal */}
        <ChangelogModal open={showChangelog} onOpenChange={setShowChangelog} />
      </div>
    </RealtimeContext.Provider>
  );
}
