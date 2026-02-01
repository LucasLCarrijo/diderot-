import { ConnectionStatus } from "@/hooks/useAdminRealtime";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface RealtimeIndicatorProps {
  status: ConnectionStatus;
  lastUpdate: Date;
  isPaused?: boolean;
}

export function RealtimeIndicator({ status, lastUpdate, isPaused }: RealtimeIndicatorProps) {
  const statusConfig = {
    connected: {
      label: "Live",
      color: "bg-green-500",
      textColor: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-500/10",
      tooltip: "Dados atualizando em tempo real",
      pulse: true,
    },
    connecting: {
      label: "Conectando",
      color: "bg-yellow-500",
      textColor: "text-yellow-600 dark:text-yellow-400",
      bgColor: "bg-yellow-500/10",
      tooltip: "Estabelecendo conexão...",
      pulse: false,
    },
    syncing: {
      label: "Sincronizando",
      color: "bg-yellow-500",
      textColor: "text-yellow-600 dark:text-yellow-400",
      bgColor: "bg-yellow-500/10",
      tooltip: "Reconectando ao servidor...",
      pulse: true,
    },
    disconnected: {
      label: "Offline",
      color: "bg-red-500",
      textColor: "text-red-600 dark:text-red-400",
      bgColor: "bg-red-500/10",
      tooltip: `Última atualização: ${formatDistanceToNow(lastUpdate, { addSuffix: true, locale: ptBR })}`,
      pulse: false,
    },
  };

  const config = isPaused && status === "connected" 
    ? { ...statusConfig.connected, label: "Pausado", pulse: false, tooltip: "Atualizações pausadas" }
    : statusConfig[status];

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge
          variant="outline"
          className={cn(
            "gap-1.5 px-2 py-0.5 text-xs font-medium cursor-default border-0",
            config.bgColor,
            config.textColor
          )}
        >
          <span className="relative flex h-2 w-2">
            {config.pulse && (
              <span
                className={cn(
                  "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
                  config.color
                )}
              />
            )}
            <span
              className={cn(
                "relative inline-flex rounded-full h-2 w-2",
                config.color
              )}
            />
          </span>
          <span className="hidden sm:inline">{config.label}</span>
        </Badge>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        <p>{config.tooltip}</p>
      </TooltipContent>
    </Tooltip>
  );
}
