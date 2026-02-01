import { useState, useEffect, useRef } from "react";
import { RealtimeEvent } from "@/hooks/useAdminRealtime";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Pause, Play, Trash2, ExternalLink, Activity } from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";

interface ActivityFeedProps {
  events: RealtimeEvent[];
  isPaused: boolean;
  onTogglePause: () => void;
  onClear: () => void;
  onEventClick?: (event: RealtimeEvent) => void;
  className?: string;
  compact?: boolean;
}

export function ActivityFeed({
  events,
  isPaused,
  onTogglePause,
  onClear,
  onEventClick,
  className,
  compact = false,
}: ActivityFeedProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  // Auto-scroll to top when new events arrive
  useEffect(() => {
    if (autoScroll && !isPaused && scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [events.length, autoScroll, isPaused]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    // Disable auto-scroll if user scrolls down
    setAutoScroll(target.scrollTop < 50);
  };

  if (events.length === 0) {
    return (
      <Card className={cn("border-admin-border", className)}>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Feed de Atividades
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Nenhuma atividade recente</p>
            <p className="text-xs mt-1">Eventos aparecerão aqui em tempo real</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("border-admin-border", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Feed de Atividades
            <Badge variant="secondary" className="text-[10px]">
              {events.length}
            </Badge>
          </CardTitle>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={onTogglePause}
            >
              {isPaused ? (
                <Play className="h-3.5 w-3.5" />
              ) : (
                <Pause className="h-3.5 w-3.5" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={onClear}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea
          className={cn("px-4 pb-4", compact ? "h-[300px]" : "h-[400px]")}
          ref={scrollRef}
          onScrollCapture={handleScroll}
        >
          <div className="space-y-2">
            {events.map((event, index) => (
              <div
                key={event.id}
                className={cn(
                  "flex items-start gap-3 p-2 rounded-lg transition-all duration-300",
                  event.isNew && index === 0 && "animate-pulse bg-primary/5",
                  "hover:bg-muted/50 cursor-pointer group"
                )}
                onClick={() => onEventClick?.(event)}
                style={{
                  animationDelay: event.isNew ? "0ms" : undefined,
                  animationIterationCount: event.isNew ? "2" : undefined,
                }}
              >
                {event.user?.avatar ? (
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarImage src={event.user.avatar} />
                    <AvatarFallback className="text-xs">
                      {event.user.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                ) : (
                  <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0 text-lg">
                    {event.icon}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm leading-snug">
                    <span className="mr-1.5">{event.icon}</span>
                    {event.message}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {formatDistanceToNow(event.timestamp, {
                      addSuffix: true,
                      locale: ptBR,
                    })}
                  </p>
                </div>
                {event.resourceUrl && (
                  <Link
                    to={event.resourceUrl}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <ExternalLink className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                  </Link>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
