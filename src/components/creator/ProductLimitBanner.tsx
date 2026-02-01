import { AlertTriangle, Crown, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";

interface ProductLimitBannerProps {
  currentCount: number;
  limit: number;
  isPro?: boolean;
}

export function ProductLimitBanner({
  currentCount,
  limit,
  isPro = false,
}: ProductLimitBannerProps) {
  const navigate = useNavigate();

  // Pro users have unlimited products
  if (isPro || limit === Infinity) {
    return null;
  }

  const percentage = Math.min((currentCount / limit) * 100, 100);
  const isNearLimit = percentage >= 80;
  const isAtLimit = currentCount >= limit;

  // Only show banner when near or at limit
  if (percentage < 60) {
    return null;
  }

  return (
    <Card
      className={`border-2 mb-6 ${
        isAtLimit
          ? "border-destructive bg-destructive/5"
          : isNearLimit
          ? "border-yellow-500 bg-yellow-500/5"
          : "border-border"
      }`}
    >
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3 flex-1">
            {isAtLimit ? (
              <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
            ) : (
              <TrendingUp className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <p className="font-medium">
                {isAtLimit
                  ? "Você atingiu o limite de produtos!"
                  : `${currentCount} de ${limit} produtos criados`}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {isAtLimit
                  ? "Faça upgrade para Creator Pro para adicionar produtos ilimitados."
                  : "Você está próximo do limite do plano gratuito."}
              </p>
              <Progress value={percentage} className="mt-3 h-2" />
            </div>
          </div>
          <Button
            onClick={() => navigate('/creator/pricing')}
            className={isAtLimit ? "" : "shrink-0"}
          >
            <Crown className="h-4 w-4 mr-2" />
            Upgrade para Pro
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
