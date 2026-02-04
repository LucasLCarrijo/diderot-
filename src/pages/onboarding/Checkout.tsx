import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Lock, CreditCard, ShieldCheck, Loader2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";
import { SiteHeader } from "@/components/site/SiteHeader";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

// Toggle this to switch between mock and real Stripe
const USE_MOCK_PAYMENT = true;

export default function Checkout() {
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();
    const [isProcessing, setIsProcessing] = useState(false);
    const [agreeTerms, setAgreeTerms] = useState(false);

    const plan = location.state?.plan || "annual";
    const amount = plan === "annual" ? "299,90" : "29,90";

    const handleCheckout = async () => {
        if (!agreeTerms) {
            toast.error("Você deve aceitar os termos para continuar");
            return;
        }

        if (!user) {
            toast.error("Você precisa estar logado");
            navigate("/auth/signin");
            return;
        }

        setIsProcessing(true);

        try {
            if (USE_MOCK_PAYMENT) {
                // Mock payment - simulate processing delay
                await new Promise(resolve => setTimeout(resolve, 2000));

                toast.success("Pagamento simulado com sucesso!");
                navigate("/onboarding/processing");
            } else {
                // Real Stripe integration (when Supabase is back)
                const { supabase } = await import("@/integrations/supabase/client");

                const priceId = plan === "annual"
                    ? import.meta.env.VITE_STRIPE_ANNUAL_PRICE_ID
                    : import.meta.env.VITE_STRIPE_MONTHLY_PRICE_ID;

                const { data, error } = await supabase.functions.invoke('create-checkout', {
                    body: {
                        priceId,
                        userId: user.id,
                    },
                });

                if (error) throw error;

                if (data?.url) {
                    window.location.href = data.url;
                } else {
                    throw new Error("URL de checkout não retornada");
                }
            }
        } catch (error: any) {
            console.error("Checkout error:", error);
            toast.error(error.message || "Erro ao processar pagamento");
            setIsProcessing(false);
        }
    };

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <SiteHeader />

            {/* Banner */}
            <div className="bg-primary/5 border-b border-primary/10 py-3 text-center">
                <p className="text-sm font-medium text-primary">
                    Seu acesso começa agora. Cancele quando quiser ✨
                </p>
            </div>

            <div className="flex-1 container max-w-4xl py-8 md:py-12">
                <div className="grid md:grid-cols-3 gap-8">

                    {/* Summary Column */}
                    <div className="md:col-span-1 order-2 md:order-2 space-y-6">
                        <Card className="p-6 bg-secondary/30">
                            <h3 className="font-semibold mb-4 text-lg">Resumo do Pedido</h3>

                            <div className="flex justify-between items-start py-4 border-b">
                                <div>
                                    <p className="font-medium">Plano Creator {plan === "annual" ? "Anual" : "Mensal"}</p>
                                    <p className="text-sm text-muted-foreground">{plan === "annual" ? "Cobrado anualmente" : "Cobrado mensalmente"}</p>
                                </div>
                                <p className="font-semibold">R$ {amount}</p>
                            </div>

                            <div className="flex justify-between items-center py-4 font-bold text-lg">
                                <span>Total</span>
                                <span>R$ {amount}</span>
                            </div>

                            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-background p-3 rounded border">
                                <ShieldCheck className="h-4 w-4 text-green-600" />
                                <span>Pagamento criptografado e seguro</span>
                            </div>
                        </Card>
                    </div>

                    {/* Payment Form Column */}
                    <div className="md:col-span-2 order-1 md:order-1">
                        <div className="mb-8">
                            <h1 className="text-2xl font-bold">Pagamento</h1>
                            <p className="text-muted-foreground">
                                {USE_MOCK_PAYMENT ? "Modo de demonstração" : "Processamento seguro via Stripe"}
                            </p>
                        </div>

                        <div className="space-y-6">
                            {/* Payment Method Info */}
                            <div className="border-2 border-primary bg-primary/5 rounded-xl p-6 flex items-center justify-center gap-3">
                                <CreditCard className="h-6 w-6 text-primary" />
                                <span className="font-medium">
                                    {USE_MOCK_PAYMENT ? "Pagamento Simulado (Demo)" : "Cartão de Crédito via Stripe"}
                                </span>
                            </div>

                            {USE_MOCK_PAYMENT && (
                                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                                        <strong>Modo Demo:</strong> O pagamento será simulado. Nenhuma cobrança real será feita.
                                    </p>
                                </div>
                            )}

                            <div className="pt-4">
                                <div className="flex items-start space-x-3">
                                    <Checkbox
                                        id="agreeTerms"
                                        checked={agreeTerms}
                                        onCheckedChange={(checked) => setAgreeTerms(checked === true)}
                                    />
                                    <div className="grid gap-1.5 leading-none">
                                        <label
                                            htmlFor="agreeTerms"
                                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                        >
                                            Li e concordo com os Termos de Serviço e Política de Privacidade
                                        </label>
                                    </div>
                                </div>
                            </div>

                            <Button
                                onClick={handleCheckout}
                                className="w-full text-lg h-12 mt-6"
                                disabled={isProcessing || !agreeTerms}
                            >
                                {isProcessing ? (
                                    <>
                                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                        {USE_MOCK_PAYMENT ? "Processando..." : "Redirecionando para pagamento..."}
                                    </>
                                ) : (
                                    <>
                                        Começar agora <ArrowRight className="ml-2 h-5 w-5" />
                                    </>
                                )}
                            </Button>

                            <p className="text-center text-xs text-muted-foreground flex items-center justify-center gap-1">
                                <Lock className="h-3 w-3" />
                                {USE_MOCK_PAYMENT ? "Demonstração - Nenhuma cobrança real" : "Pagamento 100% seguro via Stripe"}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
