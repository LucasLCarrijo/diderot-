import { Link, useLocation } from "react-router-dom";
import { Package, FolderOpen, Image, BarChart3, Users, Settings, ChevronLeft, CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Meus Produtos", href: "/creator/shop", icon: Package },
  { name: "Coleções", href: "/creator/collections", icon: FolderOpen },
  { name: "Posts", href: "/creator/posts", icon: Image },
  { name: "Audiência", href: "/creator/audience", icon: Users },
  { name: "Analytics", href: "/creator/analytics", icon: BarChart3 },
  { name: "Configurações", href: "/creator/settings", icon: Settings },
  { name: "Faturamento", href: "/creator/billing", icon: CreditCard },
];

export function CreatorSidebar() {
  const location = useLocation();

  return (
    <aside className="w-64 border-r border-border bg-background min-h-[calc(100vh-4rem)] hidden lg:block">
      <div className="p-4">
        <Link
          to="/"
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ChevronLeft className="h-4 w-4" />
          Voltar ao site
        </Link>

        <nav className="space-y-1">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
