import { AlertTriangle } from "lucide-react";

interface AffiliateDisclosureProps {
  className?: string;
  compact?: boolean;
}

export function AffiliateDisclosure({ className = "", compact = false }: AffiliateDisclosureProps) {
  if (compact) {
    return (
      <p className={`text-xs text-muted-foreground flex items-center gap-1 ${className}`}>
        <AlertTriangle className="h-3 w-3" />
        Link de afiliado
      </p>
    );
  }
  
  return (
    <div className={`flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 ${className}`}>
      <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
      <p className="text-xs text-muted-foreground">
        Este link contém código de afiliado. O creator pode receber comissão por compras realizadas.
      </p>
    </div>
  );
}
