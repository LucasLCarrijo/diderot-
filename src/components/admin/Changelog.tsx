import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Sparkles, Bug, Zap, Gift } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ChangelogEntry {
  id: string;
  version: string;
  date: Date;
  type: "feature" | "fix" | "improvement" | "announcement";
  title: string;
  description: string;
  isNew?: boolean;
}

const CHANGELOG_STORAGE_KEY = "admin-changelog-seen";
const CURRENT_VERSION = "2.4.0";

const changelogData: ChangelogEntry[] = [
  {
    id: "1",
    version: "2.4.0",
    date: new Date("2025-01-09"),
    type: "feature",
    title: "Dashboard Real-Time",
    description: "Novo sistema de métricas em tempo real com WebSocket, incluindo usuários online, clicks por minuto e conversões Pro.",
    isNew: true,
  },
  {
    id: "2",
    version: "2.4.0",
    date: new Date("2025-01-09"),
    type: "feature",
    title: "Command Palette",
    description: "Busca rápida com Cmd+K para navegar, buscar usuários e executar ações.",
    isNew: true,
  },
  {
    id: "3",
    version: "2.4.0",
    date: new Date("2025-01-09"),
    type: "improvement",
    title: "Dark Mode e Responsividade",
    description: "Suporte completo a dark mode e otimização para dispositivos móveis.",
    isNew: true,
  },
  {
    id: "4",
    version: "2.3.0",
    date: new Date("2025-01-05"),
    type: "feature",
    title: "Sistema de Notificações",
    description: "Notificações in-app para alertas críticos, urgentes e informativos.",
  },
  {
    id: "5",
    version: "2.3.0",
    date: new Date("2025-01-05"),
    type: "feature",
    title: "Gerador de Relatórios",
    description: "Gere relatórios personalizados em PDF ou Excel.",
  },
  {
    id: "6",
    version: "2.2.0",
    date: new Date("2025-01-01"),
    type: "improvement",
    title: "Analytics Avançado",
    description: "Cohort analysis, funnel analysis e heatmaps de engajamento.",
  },
  {
    id: "7",
    version: "2.2.0",
    date: new Date("2025-01-01"),
    type: "fix",
    title: "Correção de Performance",
    description: "Otimizações de carregamento em tabelas com muitos dados.",
  },
];

const TYPE_CONFIG: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  feature: { icon: Sparkles, color: "text-purple-500", label: "Novo" },
  fix: { icon: Bug, color: "text-red-500", label: "Correção" },
  improvement: { icon: Zap, color: "text-yellow-500", label: "Melhoria" },
  announcement: { icon: Gift, color: "text-blue-500", label: "Anúncio" },
};

interface ChangelogModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ChangelogModal({ open, onOpenChange }: ChangelogModalProps) {
  // Mark as seen when opened
  useEffect(() => {
    if (open) {
      localStorage.setItem(CHANGELOG_STORAGE_KEY, CURRENT_VERSION);
    }
  }, [open]);

  // Group by version
  const groupedChangelog = changelogData.reduce((acc, entry) => {
    if (!acc[entry.version]) {
      acc[entry.version] = {
        version: entry.version,
        date: entry.date,
        entries: [],
      };
    }
    acc[entry.version].entries.push(entry);
    return acc;
  }, {} as Record<string, { version: string; date: Date; entries: ChangelogEntry[] }>);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            O que há de novo
          </DialogTitle>
          <DialogDescription>
            Últimas atualizações e melhorias no painel admin
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-6">
            {Object.values(groupedChangelog).map((group, groupIndex) => (
              <div key={group.version}>
                {groupIndex > 0 && <Separator className="mb-6" />}
                
                <div className="flex items-center gap-2 mb-4">
                  <Badge variant="outline" className="text-xs">
                    v{group.version}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {format(group.date, "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  </span>
                </div>

                <div className="space-y-4">
                  {group.entries.map((entry) => {
                    const config = TYPE_CONFIG[entry.type];
                    const Icon = config.icon;
                    
                    return (
                      <div key={entry.id} className="flex gap-3">
                        <div className={`mt-0.5 ${config.color}`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-medium">{entry.title}</h4>
                            {entry.isNew && (
                              <Badge className="bg-purple-500/10 text-purple-500 border-0 text-[10px] px-1.5">
                                Novo!
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mt-0.5">
                            {entry.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="pt-4 border-t border-border">
          <Button variant="outline" className="w-full" onClick={() => onOpenChange(false)}>
            Entendi
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Hook to check for new changelog entries
export function useChangelog() {
  const [hasNewChanges, setHasNewChanges] = useState(false);
  const [showChangelog, setShowChangelog] = useState(false);

  useEffect(() => {
    const seenVersion = localStorage.getItem(CHANGELOG_STORAGE_KEY);
    if (seenVersion !== CURRENT_VERSION) {
      setHasNewChanges(true);
    }
  }, []);

  const openChangelog = () => setShowChangelog(true);
  const closeChangelog = () => {
    setShowChangelog(false);
    setHasNewChanges(false);
  };

  return {
    hasNewChanges,
    showChangelog,
    openChangelog,
    closeChangelog,
    setShowChangelog,
  };
}
