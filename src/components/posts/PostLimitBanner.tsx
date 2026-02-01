import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Sparkles, Image } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PostLimitBannerProps {
  currentCount: number;
  maxCount: number;
  isPro?: boolean;
  className?: string;
}

export function PostLimitBanner({
  currentCount,
  maxCount,
  isPro = false,
  className,
}: PostLimitBannerProps) {
  const percentage = (currentCount / maxCount) * 100;
  const isNearLimit = percentage >= 80;
  const isAtLimit = currentCount >= maxCount;

  if (isPro) {
    return (
      <Card className={cn('border-primary/20 bg-primary/5', className)}>
        <CardContent className="py-3 px-4 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-primary" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Creator Pro</span>
              <Badge variant="secondary" className="text-xs">
                Posts ilimitados
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              {currentCount} posts criados
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isAtLimit) {
    return (
      <Card className={cn('border-destructive/50 bg-destructive/10', className)}>
        <CardContent className="py-4 px-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-destructive/20 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 text-destructive" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-destructive">Limite de posts atingido</h4>
              <p className="text-sm text-muted-foreground mt-1">
                Você atingiu o limite de {maxCount} posts por dia no plano gratuito.
                Faça upgrade para Creator Pro e tenha posts ilimitados.
              </p>
              <div className="mt-3 flex items-center gap-3">
                <Progress value={100} className="flex-1 h-2" />
                <span className="text-xs font-medium text-destructive">
                  {currentCount}/{maxCount}
                </span>
              </div>
              <Button className="mt-4" asChild>
                <Link to="/creator/billing">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Fazer upgrade para Pro
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn(
      isNearLimit ? 'border-warning/50 bg-warning/5' : 'border-border',
      className
    )}>
      <CardContent className="py-3 px-4">
        <div className="flex items-center gap-3">
          <div className={cn(
            'w-8 h-8 rounded-full flex items-center justify-center',
            isNearLimit ? 'bg-warning/20' : 'bg-muted'
          )}>
            <Image className={cn(
              'w-4 h-4',
              isNearLimit ? 'text-warning' : 'text-muted-foreground'
            )} />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium">
                {currentCount} de {maxCount} posts hoje
              </span>
              {isNearLimit && (
                <Badge variant="outline" className="text-warning border-warning">
                  Quase no limite
                </Badge>
              )}
            </div>
            <Progress 
              value={percentage} 
              className={cn(
                'h-2',
                isNearLimit && '[&>div]:bg-warning'
              )}
            />
          </div>
        </div>
        {isNearLimit && (
          <p className="text-xs text-muted-foreground mt-2 ml-11">
            <Link to="/creator/billing" className="text-primary hover:underline">
              Upgrade para Pro
            </Link>
            {' '}para posts ilimitados
          </p>
        )}
      </CardContent>
    </Card>
  );
}
