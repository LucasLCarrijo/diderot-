import { Lock, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface PaywallProps {
  feature: string;
  description: string;
  blur?: boolean;
  children?: React.ReactNode;
  className?: string;
}

export function Paywall({ 
  feature, 
  description, 
  blur = true, 
  children,
  className 
}: PaywallProps) {
  const navigate = useNavigate();

  return (
    <div className={cn("relative", className)}>
      {/* Conteúdo bloqueado */}
      {children && (
        <div className={cn(
          "transition-all duration-300",
          blur && "blur-sm pointer-events-none select-none"
        )}>
          {children}
        </div>
      )}

      {/* Overlay de bloqueio */}
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm rounded-lg p-6">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-4">
          <Lock className="h-8 w-8 text-primary" />
        </div>

        <h3 className="text-xl font-bold text-center mb-2">{feature}</h3>
        
        <p className="text-muted-foreground text-center mb-6 max-w-sm">
          {description}
        </p>

        <Button 
          onClick={() => navigate('/creator/pricing')}
          className="gap-2"
        >
          <Sparkles className="h-4 w-4" />
          Upgrade para Creator Pro
        </Button>

        <p className="text-xs text-muted-foreground mt-3">
          A partir de R$ 29,90/mês
        </p>
      </div>
    </div>
  );
}
