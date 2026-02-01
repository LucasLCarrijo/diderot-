import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  FileQuestion,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Inbox,
  Search,
  Users,
  ShoppingBag,
  FileText,
  Bell,
} from "lucide-react";

type EmptyStateType = 
  | "no-data"
  | "no-results"
  | "no-reports"
  | "no-users"
  | "no-products"
  | "no-notifications"
  | "error"
  | "success";

interface EmptyStateProps {
  type: EmptyStateType;
  title?: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

const STATE_CONFIG: Record<
  EmptyStateType,
  { icon: React.ElementType; defaultTitle: string; defaultDescription: string; iconColor: string }
> = {
  "no-data": {
    icon: Inbox,
    defaultTitle: "Nenhum dado encontrado",
    defaultDescription: "Não há dados para exibir no momento.",
    iconColor: "text-muted-foreground",
  },
  "no-results": {
    icon: Search,
    defaultTitle: "Nenhum resultado",
    defaultDescription: "Tente ajustar seus filtros ou termo de busca.",
    iconColor: "text-muted-foreground",
  },
  "no-reports": {
    icon: CheckCircle2,
    defaultTitle: "Nenhum report pendente 🎉",
    defaultDescription: "Tudo limpo! Não há denúncias aguardando revisão.",
    iconColor: "text-green-500",
  },
  "no-users": {
    icon: Users,
    defaultTitle: "Nenhum usuário encontrado",
    defaultDescription: "Não há usuários que correspondam aos critérios.",
    iconColor: "text-muted-foreground",
  },
  "no-products": {
    icon: ShoppingBag,
    defaultTitle: "Nenhum produto encontrado",
    defaultDescription: "Não há produtos para exibir.",
    iconColor: "text-muted-foreground",
  },
  "no-notifications": {
    icon: Bell,
    defaultTitle: "Nenhuma notificação",
    defaultDescription: "Você está em dia com tudo!",
    iconColor: "text-muted-foreground",
  },
  error: {
    icon: AlertCircle,
    defaultTitle: "Erro ao carregar dados",
    defaultDescription: "Ocorreu um problema ao carregar os dados.",
    iconColor: "text-destructive",
  },
  success: {
    icon: CheckCircle2,
    defaultTitle: "Operação concluída!",
    defaultDescription: "A ação foi executada com sucesso.",
    iconColor: "text-green-500",
  },
};

export function EmptyState({
  type,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  const config = STATE_CONFIG[type];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-12 px-4 text-center",
        className
      )}
    >
      <div
        className={cn(
          "rounded-full p-4 mb-4",
          type === "error" ? "bg-destructive/10" : 
          type === "success" || type === "no-reports" ? "bg-green-500/10" : 
          "bg-muted"
        )}
      >
        <Icon className={cn("h-8 w-8", config.iconColor)} />
      </div>
      
      <h3 className="text-lg font-semibold mb-1">
        {title || config.defaultTitle}
      </h3>
      
      <p className="text-sm text-muted-foreground max-w-sm mb-4">
        {description || config.defaultDescription}
      </p>

      {action && (
        <Button onClick={action.onClick} variant={type === "error" ? "outline" : "default"}>
          {type === "error" && <RefreshCw className="h-4 w-4 mr-2" />}
          {action.label}
        </Button>
      )}

      {type === "no-reports" && !action && (
        <p className="text-xs text-muted-foreground mt-2">
          Enquanto isso, que tal revisar os{" "}
          <a href="/admin/analytics" className="text-primary hover:underline">
            analytics
          </a>
          ?
        </p>
      )}
    </div>
  );
}

// Loading skeleton for tables
export function TableSkeleton({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex gap-4 p-3 border-b border-border">
        {Array.from({ length: cols }).map((_, i) => (
          <div
            key={i}
            className="h-4 bg-muted rounded animate-pulse"
            style={{ width: `${Math.random() * 100 + 50}px` }}
          />
        ))}
      </div>
      
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex gap-4 p-3">
          {Array.from({ length: cols }).map((_, colIndex) => (
            <div
              key={colIndex}
              className="h-4 bg-muted rounded animate-pulse"
              style={{ 
                width: colIndex === 0 ? "40px" : `${Math.random() * 100 + 60}px`,
                animationDelay: `${(rowIndex * cols + colIndex) * 50}ms`
              }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

// Loading skeleton for cards
export function CardSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="p-4 rounded-lg border border-border"
          style={{ animationDelay: `${i * 100}ms` }}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="h-4 w-24 bg-muted rounded animate-pulse" />
            <div className="h-8 w-8 bg-muted rounded-lg animate-pulse" />
          </div>
          <div className="h-8 w-20 bg-muted rounded animate-pulse mb-2" />
          <div className="h-3 w-16 bg-muted rounded animate-pulse" />
        </div>
      ))}
    </div>
  );
}

// Loading skeleton for charts
export function ChartSkeleton({ height = 300 }: { height?: number }) {
  return (
    <div 
      className="w-full rounded-lg border border-border p-4"
      style={{ height }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="h-5 w-32 bg-muted rounded animate-pulse" />
        <div className="h-8 w-24 bg-muted rounded animate-pulse" />
      </div>
      <div className="flex items-end gap-2 h-[calc(100%-60px)]">
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className="flex-1 bg-muted rounded-t animate-pulse"
            style={{ 
              height: `${Math.random() * 60 + 20}%`,
              animationDelay: `${i * 50}ms`
            }}
          />
        ))}
      </div>
    </div>
  );
}
