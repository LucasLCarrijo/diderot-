import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
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
  FileText,
  Search,
  UserPlus,
  Plus,
  Bell,
  Download,
} from "lucide-react";

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const NAV_PAGES = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard, keywords: ["overview", "home"] },
  { name: "Usuários", href: "/admin/users", icon: Users, keywords: ["users", "contas"] },
  { name: "Métricas Financeiras", href: "/admin/financials", icon: DollarSign, keywords: ["mrr", "arr", "revenue", "receita"] },
  { name: "North Star Metrics", href: "/admin/north-star", icon: Target, keywords: ["kpi", "meta"] },
  { name: "Analytics Avançado", href: "/admin/analytics", icon: BarChart3, keywords: ["data", "dados"] },
  { name: "Produtos & Posts", href: "/admin/content", icon: ShoppingBag, keywords: ["conteudo", "content"] },
  { name: "Brands & Campanhas", href: "/admin/brands", icon: Building2, keywords: ["marcas", "campaigns"] },
  { name: "Moderação", href: "/admin/moderation", icon: AlertTriangle, keywords: ["reports", "denuncias"] },
  { name: "Configurações", href: "/admin/settings", icon: Settings, keywords: ["config", "preferencias"] },
  { name: "Notificações", href: "/admin/notifications", icon: Bell, keywords: ["alerts", "avisos"] },
];

const QUICK_ACTIONS = [
  { name: "Gerar Relatório", action: "generate-report", icon: FileText, keywords: ["report", "export"] },
  { name: "Criar Novo Admin", action: "create-admin", icon: UserPlus, keywords: ["new admin", "adicionar"] },
  { name: "Exportar Usuários", action: "export-users", icon: Download, keywords: ["download", "csv"] },
  { name: "Buscar Usuário", action: "search-user", icon: Search, keywords: ["find", "procurar"] },
];

// Mock users for search
const MOCK_USERS = [
  { id: "1", name: "Maria Silva", handle: "@fashionista_br", type: "creator" },
  { id: "2", name: "João Santos", handle: "@tech_lucas", type: "creator" },
  { id: "3", name: "Nike Brasil", handle: "nike_brasil", type: "brand" },
  { id: "4", name: "Ana Costa", handle: "@beauty_ana", type: "creator" },
  { id: "5", name: "Pedro Oliveira", handle: "@lifestyle_pedro", type: "creator" },
];

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  const handleSelect = useCallback((callback: () => void) => {
    onOpenChange(false);
    callback();
  }, [onOpenChange]);

  const runAction = (action: string) => {
    switch (action) {
      case "generate-report":
        // This would trigger report modal
        console.log("Generate report");
        break;
      case "create-admin":
        navigate("/admin/users?action=create-admin");
        break;
      case "export-users":
        console.log("Export users");
        break;
      case "search-user":
        navigate("/admin/users");
        break;
    }
  };

  // Filter users based on search
  const filteredUsers = search.length > 1
    ? MOCK_USERS.filter(
        (user) =>
          user.name.toLowerCase().includes(search.toLowerCase()) ||
          user.handle.toLowerCase().includes(search.toLowerCase())
      )
    : [];

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput 
        placeholder="Buscar páginas, usuários ou executar ações..." 
        value={search}
        onValueChange={setSearch}
      />
      <CommandList>
        <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>

        {/* Users Search Results */}
        {filteredUsers.length > 0 && (
          <CommandGroup heading="Usuários">
            {filteredUsers.map((user) => (
              <CommandItem
                key={user.id}
                onSelect={() => handleSelect(() => navigate(`/admin/users?id=${user.id}`))}
              >
                <Users className="mr-2 h-4 w-4" />
                <span>{user.name}</span>
                <span className="ml-2 text-muted-foreground text-xs">{user.handle}</span>
                <CommandShortcut>{user.type}</CommandShortcut>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {/* Quick Actions */}
        <CommandGroup heading="Ações Rápidas">
          {QUICK_ACTIONS.map((action) => (
            <CommandItem
              key={action.action}
              onSelect={() => handleSelect(() => runAction(action.action))}
            >
              <action.icon className="mr-2 h-4 w-4" />
              <span>{action.name}</span>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        {/* Navigation */}
        <CommandGroup heading="Páginas">
          {NAV_PAGES.map((page) => (
            <CommandItem
              key={page.href}
              onSelect={() => handleSelect(() => navigate(page.href))}
            >
              <page.icon className="mr-2 h-4 w-4" />
              <span>{page.name}</span>
              <CommandShortcut>Ir</CommandShortcut>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}

// Hook to handle keyboard shortcut
export function useCommandPalette() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  return { open, setOpen };
}
