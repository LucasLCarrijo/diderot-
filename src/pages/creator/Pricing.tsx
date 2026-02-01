import { useState } from 'react';
import { Check, Sparkles, Crown, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/hooks/useSubscription';
import { PLANS, STRIPE_PRICES } from '@/lib/stripe-config';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useEffect } from 'react';
import { CreatorLayout } from '@/components/layout/CreatorLayout';

export default function PricingPage() {
  const { user, session } = useAuth();
  const { isCreatorPro, subscriptionEnd, refreshSubscription } = useSubscription();
  const [loading, setLoading] = useState<'month' | 'year' | null>(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    if (searchParams.get('canceled') === 'true') {
      toast.info('Checkout cancelado. Você pode tentar novamente quando quiser.');
    }
  }, [searchParams]);

  async function handleCheckout(priceId: string, interval: 'month' | 'year') {
    if (!user || !session?.access_token) {
      toast.error('Faça login para continuar');
      navigate('/auth/signin');
      return;
    }

    setLoading(interval);

    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { priceId },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error('Erro ao iniciar checkout. Tente novamente.');
      setLoading(null);
    }
  }

  return (
    <CreatorLayout title="Planos e Preços">
      <div className="container max-w-6xl py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 text-primary mb-4">
            <Sparkles className="h-5 w-5" />
            <span className="font-medium">Planos e Preços</span>
          </div>
          
          <h1 className="text-4xl font-bold tracking-tight mb-4">
            Escolha o plano ideal para você
          </h1>
          
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Comece grátis e faça upgrade quando precisar. Todos os planos incluem 7 dias de teste grátis.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {/* FREE PLAN */}
          <Card className="relative">
            <CardHeader>
              <CardTitle className="text-xl">Free</CardTitle>
              <CardDescription>Para começar</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-6">
                <span className="text-4xl font-bold">R$ 0</span>
                <span className="text-muted-foreground">/mês</span>
              </div>

              <ul className="space-y-3">
                {PLANS.FREE.featureList.map((feature, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-primary flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full" disabled>
                Plano Atual
              </Button>
            </CardFooter>
          </Card>

          {/* PRO MONTHLY */}
          <Card className="relative border-primary shadow-lg">
            <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary">
              Mais Popular
            </Badge>
            
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <Crown className="h-5 w-5 text-amber-500" />
                Creator Pro
              </CardTitle>
              <CardDescription>Para crescer</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-6">
                <span className="text-4xl font-bold">R$ 29,90</span>
                <span className="text-muted-foreground">/mês</span>
              </div>

              <ul className="space-y-3">
                {PLANS.CREATOR_PRO_MONTHLY.featureList.map((feature, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-primary flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              {isCreatorPro ? (
                <Button variant="outline" className="w-full" disabled>
                  Plano Atual
                </Button>
              ) : (
                <Button 
                  className="w-full gap-2"
                  onClick={() => handleCheckout(STRIPE_PRICES.CREATOR_PRO_MONTHLY, 'month')}
                  disabled={loading === 'month'}
                >
                  {loading === 'month' ? (
                    'Processando...'
                  ) : (
                    <>
                      <Zap className="h-4 w-4" />
                      Assinar Mensal
                    </>
                  )}
                </Button>
              )}
            </CardFooter>
          </Card>

          {/* PRO YEARLY */}
          <Card className="relative">
            <Badge className="absolute -top-3 left-1/2 -translate-x-1/2" variant="secondary">
              Economize 28%
            </Badge>
            
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <Crown className="h-5 w-5 text-amber-500" />
                Creator Pro Anual
              </CardTitle>
              <CardDescription>Melhor valor</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-6">
                <span className="text-4xl font-bold">R$ 249,90</span>
                <span className="text-muted-foreground">/ano</span>
              </div>

              <ul className="space-y-3">
                {PLANS.CREATOR_PRO_YEARLY.featureList.map((feature, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-primary flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              {isCreatorPro ? (
                <Button variant="outline" className="w-full" disabled>
                  Plano Atual
                </Button>
              ) : (
                <Button 
                  variant="outline"
                  className="w-full gap-2"
                  onClick={() => handleCheckout(STRIPE_PRICES.CREATOR_PRO_YEARLY, 'year')}
                  disabled={loading === 'year'}
                >
                  {loading === 'year' ? (
                    'Processando...'
                  ) : (
                    <>
                      <Zap className="h-4 w-4" />
                      Assinar Anual
                    </>
                  )}
                </Button>
              )}
            </CardFooter>
          </Card>
        </div>

        {/* FAQ ou Benefícios adicionais */}
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            Todos os planos incluem teste grátis de 7 dias. Cancele quando quiser.
          </p>
        </div>
      </div>
    </CreatorLayout>
  );
}
