import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertCircle, CreditCard, ExternalLink, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SiteHeader } from "@/components/site/SiteHeader";
import { useSubscriptionStatus } from "@/hooks/useSubscriptionStatus";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { STRIPE_PRICES } from "@/lib/stripe-config";

export default function Reactivate() {
  const { session } = useAuth();
  const { status, periodEnd, loading } = useSubscriptionStatus();
  const navigate = useNavigate();
  const [portalLoading, setPortalLoading] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState<"monthly" | "annual" | null>(null);

  const isPastDue = status === "past_due";
  const isCanceled = status === "canceled";

  const formattedEnd = periodEnd
    ? format(periodEnd, "dd/MM/yyyy", { locale: ptBR })
    : null;

  async function handleManagePayment() {
    if (!session?.access_token) return;
    setPortalLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("customer-portal", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (error) throw error;
      if (data?.url) window.open(data.url, "_blank");
    } catch {
      toast.error("Erro ao abrir portal de faturamento. Tente novamente.");
    } finally {
      setPortalLoading(false);
    }
  }

  async function handleNewCheckout(plan: "monthly" | "annual") {
    if (!session?.access_token) return;
    setCheckoutLoading(plan);
    const priceId =
      plan === "annual"
        ? STRIPE_PRICES.CREATOR_PRO_YEARLY
        : STRIPE_PRICES.CREATOR_PRO_MONTHLY;
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { priceId },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (error) throw error;
      if (data?.url) window.location.href = data.url;
    } catch {
      toast.error("Erro ao iniciar checkout. Tente novamente.");
    } finally {
      setCheckoutLoading(null);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SiteHeader />

      <div className="flex-1 flex items-center justify-center p-4">
        <div className="max-w-lg w-full space-y-8 animate-fade-in">
          {/* Status Banner */}
          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-destructive/10 mx-auto">
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>

            <h1 className="text-3xl font-bold tracking-tight">
              {isPastDue ? "Problema com seu pagamento" : "Assinatura inativa"}
            </h1>

            <p className="text-muted-foreground text-lg">
              {isPastDue
                ? "Houve um problema com seu pagamento. Atualize seu cartão para manter sua loja ativa."
                : "Sua assinatura está inativa. Reative para continuar usando sua loja Creator."}
            </p>

            {formattedEnd && (
              <p className="text-sm text-muted-foreground">
                Loja desativada em: <span className="font-medium text-foreground">{formattedEnd}</span>
              </p>
            )}
          </div>

          {/* Action */}
          {isPastDue ? (
            <Card className="p-6 space-y-4">
              <div className="flex items-start gap-3">
                <CreditCard className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">Atualizar método de pagamento</p>
                  <p className="text-sm text-muted-foreground">
                    Acesse o portal de faturamento para atualizar seu cartão e reativar automaticamente.
                  </p>
                </div>
              </div>
              <Button
                className="w-full gap-2"
                onClick={handleManagePayment}
                disabled={portalLoading}
              >
                {portalLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ExternalLink className="h-4 w-4" />
                )}
                Atualizar Cartão
              </Button>
            </Card>
          ) : (
            <div className="space-y-4">
              <p className="text-center text-sm font-medium text-muted-foreground">
                Escolha um plano para reativar sua loja:
              </p>

              {/* Monthly plan */}
              <Card
                className="p-5 border-2 hover:border-primary/50 transition-colors cursor-pointer"
                onClick={() => !checkoutLoading && handleNewCheckout("monthly")}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-lg">Mensal</p>
                    <p className="text-sm text-muted-foreground">Cancele quando quiser</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">R$ 29,90</p>
                    <p className="text-sm text-muted-foreground">/mês</p>
                  </div>
                </div>
                <Button
                  className="w-full mt-4 gap-2"
                  variant="outline"
                  disabled={!!checkoutLoading}
                  onClick={(e) => { e.stopPropagation(); handleNewCheckout("monthly"); }}
                >
                  {checkoutLoading === "monthly" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                  Reativar Mensal
                </Button>
              </Card>

              {/* Annual plan */}
              <Card
                className="p-5 border-2 border-primary hover:border-primary transition-colors cursor-pointer bg-primary/5"
                onClick={() => !checkoutLoading && handleNewCheckout("annual")}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-lg">Anual</p>
                    <p className="text-sm text-green-600 font-medium">Economize 2 meses!</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">R$ 299,90</p>
                    <p className="text-sm text-muted-foreground">/ano</p>
                  </div>
                </div>
                <Button
                  className="w-full mt-4 gap-2"
                  disabled={!!checkoutLoading}
                  onClick={(e) => { e.stopPropagation(); handleNewCheckout("annual"); }}
                >
                  {checkoutLoading === "annual" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                  Reativar Anual
                </Button>
              </Card>
            </div>
          )}

          <p
            className="text-center text-sm text-muted-foreground cursor-pointer hover:text-foreground underline"
            onClick={() => navigate("/")}
          >
            Voltar ao início
          </p>
        </div>
      </div>
    </div>
  );
}
