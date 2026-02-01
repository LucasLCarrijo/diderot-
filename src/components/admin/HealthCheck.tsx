import { useState, useEffect } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Activity,
  Database,
  Cloud,
  Mail,
  Search,
  CreditCard,
  Server,
  RefreshCw,
  ExternalLink,
} from "lucide-react";

type ServiceStatus = "operational" | "degraded" | "down" | "checking";

interface Service {
  id: string;
  name: string;
  icon: React.ElementType;
  status: ServiceStatus;
  latency?: number;
  lastCheck: Date;
}

const STATUS_CONFIG: Record<ServiceStatus, { label: string; color: string; bgColor: string }> = {
  operational: { label: "Operacional", color: "text-green-500", bgColor: "bg-green-500" },
  degraded: { label: "Degradado", color: "text-yellow-500", bgColor: "bg-yellow-500" },
  down: { label: "Indisponível", color: "text-red-500", bgColor: "bg-red-500" },
  checking: { label: "Verificando...", color: "text-muted-foreground", bgColor: "bg-muted" },
};

// Mock service health data
const mockServices: Service[] = [
  { id: "api", name: "API", icon: Server, status: "operational", latency: 45, lastCheck: new Date() },
  { id: "database", name: "Database", icon: Database, status: "operational", latency: 12, lastCheck: new Date() },
  { id: "storage", name: "Storage", icon: Cloud, status: "operational", latency: 89, lastCheck: new Date() },
  { id: "email", name: "Email Service", icon: Mail, status: "degraded", latency: 234, lastCheck: new Date() },
  { id: "search", name: "Search", icon: Search, status: "operational", latency: 67, lastCheck: new Date() },
  { id: "payments", name: "Pagamentos", icon: CreditCard, status: "operational", latency: 156, lastCheck: new Date() },
];

export function HealthCheck() {
  const [services, setServices] = useState<Service[]>(mockServices);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Calculate overall status
  const overallStatus: ServiceStatus = services.some((s) => s.status === "down")
    ? "down"
    : services.some((s) => s.status === "degraded")
    ? "degraded"
    : "operational";

  const handleRefresh = async () => {
    setIsRefreshing(true);
    
    // Simulate checking services
    setServices((prev) =>
      prev.map((s) => ({ ...s, status: "checking" as ServiceStatus }))
    );

    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Restore with potentially updated statuses
    setServices((prev) =>
      prev.map((s) => ({
        ...s,
        status: Math.random() > 0.1 ? "operational" : "degraded",
        latency: Math.floor(Math.random() * 200) + 10,
        lastCheck: new Date(),
      }))
    );

    setIsRefreshing(false);
  };

  const StatusDot = ({ status }: { status: ServiceStatus }) => (
    <span
      className={cn(
        "h-2 w-2 rounded-full",
        STATUS_CONFIG[status].bgColor,
        status === "operational" && "animate-pulse"
      )}
    />
  );

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "h-8 gap-2 px-2",
            STATUS_CONFIG[overallStatus].color
          )}
        >
          <StatusDot status={overallStatus} />
          <Activity className="h-4 w-4" />
          <span className="hidden lg:inline text-xs">
            {STATUS_CONFIG[overallStatus].label}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <StatusDot status={overallStatus} />
              <h4 className="font-semibold">Status dos Serviços</h4>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
            </Button>
          </div>

          <div className="space-y-2">
            {services.map((service) => {
              const Icon = service.icon;
              const config = STATUS_CONFIG[service.status];
              
              return (
                <div
                  key={service.id}
                  className="flex items-center justify-between py-2 px-2 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{service.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {service.latency && service.status !== "checking" && (
                      <span className="text-xs text-muted-foreground">
                        {service.latency}ms
                      </span>
                    )}
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[10px] px-1.5",
                        config.color,
                        service.status === "checking" && "animate-pulse"
                      )}
                    >
                      {config.label}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-2 border-t border-border">
            <Button variant="ghost" size="sm" className="w-full justify-center text-xs" asChild>
              <a href="https://status.diderot.com" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-3 w-3 mr-1.5" />
                Ver Status Page Completo
              </a>
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
