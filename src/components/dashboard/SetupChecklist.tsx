import { useState } from "react";
import { Link } from "react-router-dom";
import { Check, ChevronDown, ChevronUp, Copy, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface SetupChecklistProps {
  username: string | null | undefined;
  hasAvatar: boolean;
  hasBio: boolean;
  hasProduct: boolean;
}

export function SetupChecklist({
  username,
  hasAvatar,
  hasBio,
  hasProduct,
}: SetupChecklistProps) {
  const [collapsed, setCollapsed] = useState(false);

  const storeUrl = username ? `${window.location.origin}/${username}` : null;

  // Item 4: store can be "shared" once we have username + at least one product
  const hasShared = !!username && hasProduct;

  const items = [
    { label: "Adicionar foto de perfil", done: hasAvatar, href: "/creator/settings" },
    { label: "Escrever sua bio", done: hasBio, href: "/creator/settings" },
    { label: "Adicionar primeiro produto", done: hasProduct, href: "/creator/shop/new" },
    { label: "Compartilhar sua loja", done: hasShared, href: null },
  ];

  const completedCount = items.filter((i) => i.done).length;
  const allDone = completedCount === items.length;

  // Hide checklist when everything is done
  if (allDone) return null;

  const handleCopyLink = () => {
    if (!storeUrl) return;
    navigator.clipboard.writeText(storeUrl);
    toast.success("Link copiado!");
  };

  return (
    <div className="mb-6 rounded-xl border bg-card overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-secondary/30 transition-colors"
        onClick={() => setCollapsed((v) => !v)}
      >
        <div className="flex items-center gap-3">
          <div className="text-sm font-semibold">
            Configure sua loja — {completedCount}/{items.length} concluídos
          </div>
          <div className="flex gap-1">
            {items.map((item, i) => (
              <div
                key={i}
                className={`h-1.5 w-6 rounded-full transition-colors ${
                  item.done ? "bg-primary" : "bg-border"
                }`}
              />
            ))}
          </div>
        </div>
        {collapsed ? (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        )}
      </button>

      {!collapsed && (
        <div className="px-5 pb-5 space-y-3">
          {items.map((item, i) => (
            <div key={i} className="flex items-center gap-3">
              <div
                className={`h-6 w-6 rounded-full flex items-center justify-center shrink-0 border-2 transition-colors ${
                  item.done
                    ? "bg-primary border-primary text-primary-foreground"
                    : "border-border"
                }`}
              >
                {item.done && <Check className="h-3.5 w-3.5" />}
              </div>

              <span
                className={`flex-1 text-sm ${
                  item.done ? "line-through text-muted-foreground" : "font-medium"
                }`}
              >
                {item.label}
              </span>

              {!item.done && (
                item.href ? (
                  <Button asChild size="sm" variant="outline" className="h-7 text-xs px-2">
                    <Link to={item.href}>Completar</Link>
                  </Button>
                ) : (
                  storeUrl && (
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs px-2 gap-1"
                        onClick={handleCopyLink}
                      >
                        <Copy className="h-3 w-3" />
                        Copiar link
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs px-2 gap-1"
                        onClick={() => window.open(storeUrl, "_blank")}
                      >
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    </div>
                  )
                )
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
