import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  CreditCard, 
  Calendar, 
  CheckCircle2, 
  AlertCircle,
  ExternalLink,
  Crown,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/hooks/useSubscription';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CreatorLayout } from '@/components/layout/CreatorLayout';
import { SubscriptionBadge } from '@/components/subscription/SubscriptionBadge';

export default function BillingPage() {
  const { session } = useAuth();
  const { 
    subscribed, 
    isCreatorPro, 
    subscriptionEnd, 
    status,
    cancelAtPeriodEnd,
    isLoading, 
    refreshSubscription 
  } = useSubscription();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [portalLoading, setPortalLoading] = useState(false);

  useEffect(() => {
    if (searchParams.get('success') === 'true') {
      toast.success('Assinatura ativada com sucesso! Bem-vindo ao Creator Pro!');
      refreshSubscription();
    }
  }, [searchParams, refreshSubscription]);

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

  const formattedEndDate = subscriptionEnd 
    ? format(new Date(subscriptionEnd), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
    : null;

  const statusLabels: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    active: { label: 'Ativa', variant: 'default' },
    trialing: { label: 'Período de teste', variant: 'secondary' },
    past_due: { label: 'Pagamento atrasado', variant: 'destructive' },
    canceled: { label: 'Cancelada', variant: 'outline' },
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

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Current Plan */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      Plano Atual
                      <SubscriptionBadge tier={isCreatorPro ? 'creator_pro' : 'free'} />
                    </CardTitle>
                    <CardDescription>
                      {isCreatorPro ? 'Você tem acesso a todos os recursos' : 'Recursos limitados'}
                    </CardDescription>
                  </div>
                  {!isCreatorPro && (
                    <Button onClick={() => navigate('/creator/pricing')}>
                      <Crown className="h-4 w-4 mr-2" />
                      Fazer Upgrade
                    </Button>
                  )}
                </div>
              </CardHeader>
              
              {isCreatorPro && subscriptionEnd && (
                <>
                  <Separator />
                  <CardContent className="pt-6">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="flex items-start gap-3">
                        <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="text-sm font-medium">
                            {cancelAtPeriodEnd ? 'Expira em' : 'Próxima cobrança'}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {formattedEndDate}
                          </p>
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
                          <Badge variant={statusLabels[status || 'active']?.variant || 'default'}>
                            {statusLabels[status || 'active']?.label || status}
                          </Badge>
                          {cancelAtPeriodEnd && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Cancelamento agendado
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </>
              )}
            </Card>

            {/* Manage Subscription */}
            {isCreatorPro && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Gerenciar Assinatura
                  </CardTitle>
                  <CardDescription>
                    Atualize seu método de pagamento, altere seu plano ou cancele
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
            )}

            {/* Free Plan Info */}
            {!isCreatorPro && (
              <Card>
                <CardHeader>
                  <CardTitle>Recursos do Plano Free</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      Até 15 produtos
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      Até 3 coleções
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      10 posts por dia
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      Links de afiliado
                    </li>
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </CreatorLayout>
  );
}
