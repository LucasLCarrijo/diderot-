import { AlertCircle, Sparkles, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface LimitBannerProps {
  current: number;
  max: number;
  type: 'products' | 'collections' | 'posts';
  dismissible?: boolean;
  className?: string;
}

const typeLabels = {
  products: { singular: 'produto', plural: 'produtos' },
  collections: { singular: 'coleção', plural: 'coleções' },
  posts: { singular: 'post', plural: 'posts' },
};

export function LimitBanner({ 
  current, 
  max, 
  type, 
  dismissible = true,
  className 
}: LimitBannerProps) {
  const navigate = useNavigate();
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || max === Infinity) return null;

  const percentage = (current / max) * 100;
  const isNearLimit = percentage >= 80;
  const isAtLimit = current >= max;

  if (!isNearLimit) return null;

  const label = typeLabels[type];

  return (
    <Alert 
      variant={isAtLimit ? "destructive" : "default"} 
      className={cn("relative", className)}
    >
      <AlertCircle className="h-4 w-4" />
      <AlertDescription className="flex items-center justify-between gap-4 flex-wrap">
        <span>
          {isAtLimit ? (
            <>
              Você atingiu o limite de {max} {label.plural}. 
              Faça upgrade para continuar adicionando.
            </>
          ) : (
            <>
              Você está usando {current} de {max} {label.plural} disponíveis.
            </>
          )}
        </span>
        
        <div className="flex items-center gap-2">
          <Button 
            size="sm" 
            variant={isAtLimit ? "default" : "outline"}
            onClick={() => navigate('/creator/pricing')}
            className="gap-1"
          >
            <Sparkles className="h-3 w-3" />
            Upgrade
          </Button>
          
          {dismissible && !isAtLimit && (
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={() => setDismissed(true)}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
}
