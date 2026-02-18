import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  CreditCard,
  Calendar,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscriptionStatus } from '@/hooks/useSubscriptionStatus';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CreatorLayout } from '@/components/layout/CreatorLayout';

export default function BillingPage() {
  const { session } = useAuth();
  const { status, plan, periodEnd, loading } = useSubscriptionStatus();
  const [searchParams] = useSearchParams();
  const [portalLoading, setPortalLoading] = useState(false);

  useEffect(() => {
    if (searchParams.get('success') === 'true') {
      toast.success('Assinatura ativada com sucesso! Bem-vindo ao Creator Pro!');
    }
  }, [searchParams]);

  async function handleManageSubscription() {
    if (!session?.access_token) {
      toast.error('Você precisa estar logado');
      return;
    }

    setPortalLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('customer-portal', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, '_blank');
      } else {
        throw new Error('No portal URL returned');
      }
    } catch (error) {
      console.error('Portal error:', error);
      toast.error('Erro ao abrir portal de gerenciamento');
    } finally {
      setPortalLoading(false);
    }
  }

  const formattedEndDate = periodEnd
    ? format(periodEnd, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
    : null;

  const statusLabels: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    active: { label: 'Ativa', variant: 'default' },
    trialing: { label: 'Período de teste (14 dias)', variant: 'secondary' },
    past_due: { label: 'Pagamento atrasado', variant: 'destructive' },
    canceled: { label: 'Cancelada', variant: 'outline' },
  };

  const planLabels: Record<string, string> = {
    monthly: 'Creator Pro — Mensal',
    annual: 'Creator Pro — Anual',
  };

  return (
    <CreatorLayout title="Faturamento">
      <div className="container max-w-4xl py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Faturamento</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie sua assinatura e método de pagamento
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Current Subscription */}
            <Card>
              <CardHeader>
                <CardTitle>Assinatura Atual</CardTitle>
                <CardDescription>
                  {plan ? planLabels[plan] ?? 'Creator Pro' : 'Creator Pro'}
                </CardDescription>
              </CardHeader>

              {periodEnd && (
                <>
                  <Separator />
                  <CardContent className="pt-6">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="flex items-start gap-3">
                        <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="text-sm font-medium">Próxima renovação</p>
                          <p className="text-sm text-muted-foreground">{formattedEndDate}</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        {status === 'active' || status === 'trialing' ? (
                          <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                        ) : (
                          <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
                        )}
                        <div>
                          <p className="text-sm font-medium">Status</p>
                          <Badge variant={statusLabels[status || 'active']?.variant ?? 'default'}>
                            {statusLabels[status || 'active']?.label ?? status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </>
              )}
            </Card>

            {/* Portal */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Gerenciar Assinatura
                </CardTitle>
                <CardDescription>
                  Atualize seu cartão, altere o plano ou cancele a qualquer momento
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  variant="outline"
                  onClick={handleManageSubscription}
                  disabled={portalLoading}
                  className="gap-2"
                >
                  {portalLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ExternalLink className="h-4 w-4" />
                  )}
                  Abrir Portal de Faturamento
                </Button>
                <p className="text-xs text-muted-foreground mt-2">
                  Você será redirecionado para o portal seguro do Stripe
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </CreatorLayout>
  );
}
