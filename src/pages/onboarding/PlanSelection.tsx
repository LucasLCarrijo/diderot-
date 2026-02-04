import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SiteHeader } from "@/components/site/SiteHeader";

export default function PlanSelection() {
    const navigate = useNavigate();
    const [selectedPlan, setSelectedPlan] = useState<"monthly" | "annual">("annual");

    const handleContinue = () => {
        navigate("/onboarding/checkout", { state: { plan: selectedPlan } });
    };

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <SiteHeader />

            <div className="flex-1 flex flex-col items-center justify-center p-4 animate-fade-in">
                <div className="max-w-4xl w-full space-y-12">

                    <div className="text-center space-y-4">
                        <h1 className="text-3xl md:text-5xl font-bold tracking-tight max-w-2xl mx-auto">
                            Escolha seu plano e comece a ganhar
                        </h1>
                        <p className="text-muted-foreground text-xl max-w-lg mx-auto">
                            Todas as ferramentas que você precisa para transformar sua audiência em renda.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8 items-start">

                        {/* Features Left */}
                        <div className="space-y-6 pt-4 md:col-span-1 hidden md:block">
                            <h3 className="text-xl font-semibold mb-6">Tudo incluso:</h3>
                            <ul className="space-y-4">
                                {[
                                    "Loja all-in-one",
                                    "Monetização fácil",
                                    "Setup rápido",
                                ].map((item) => (
                                    <li key={item} className="flex items-center gap-3">
                                        <div className="h-6 w-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center shrink-0">
                                            <Check className="h-4 w-4 text-green-600" />
                                        </div>
                                        <span className="font-medium">{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Plans Right */}
                        <div className="md:col-span-2 space-y-4">
                            {/* Annual Plan */}
                            <Card
                                className={`relative p-6 cursor-pointer transition-all border-2 ${selectedPlan === "annual"
                                    ? "border-primary bg-primary/5 shadow-md"
                                    : "border-border hover:border-primary/50"
                                    }`}
                                onClick={() => setSelectedPlan("annual")}
                            >
                                <div className="absolute -top-3 right-6">
                                    <Badge className="px-3 py-1 bg-green-500 hover:bg-green-600">Melhor Escolha (-20%)</Badge>
                                </div>

                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-xl font-semibold">Anual</h3>
                                        <p className="text-muted-foreground">Cobrado anualmente</p>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-2xl font-bold">R$ 299,90<span className="text-sm font-normal text-muted-foreground">/ano</span></div>
                                        <p className="text-sm text-green-600 font-medium">Economize 20%</p>
                                    </div>
                                    <div className={`mt-1 h-6 w-6 rounded-full border-2 ml-4 flex items-center justify-center ${selectedPlan === "annual" ? "border-primary" : "border-muted"
                                        }`}>
                                        {selectedPlan === "annual" && <div className="h-3 w-3 rounded-full bg-primary" />}
                                    </div>
                                </div>
                            </Card>

                            {/* Monthly Plan */}
                            <Card
                                className={`relative p-6 cursor-pointer transition-all border-2 ${selectedPlan === "monthly"
                                    ? "border-primary bg-primary/5 shadow-md"
                                    : "border-border hover:border-primary/50"
                                    }`}
                                onClick={() => setSelectedPlan("monthly")}
                            >
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-xl font-semibold">Mensal</h3>
                                        <p className="text-muted-foreground">Cancele a qualquer momento</p>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-2xl font-bold">R$ 29,90<span className="text-sm font-normal text-muted-foreground">/mês</span></div>
                                    </div>
                                    <div className={`mt-1 h-6 w-6 rounded-full border-2 ml-4 flex items-center justify-center ${selectedPlan === "monthly" ? "border-primary" : "border-muted"
                                        }`}>
                                        {selectedPlan === "monthly" && <div className="h-3 w-3 rounded-full bg-primary" />}
                                    </div>
                                </div>
                            </Card>

                            <div className="pt-8 text-center md:text-right">
                                <Button size="lg" className="w-full md:w-auto min-w-[200px]" onClick={handleContinue}>
                                    Continuar <ArrowRight className="ml-2 h-5 w-5" />
                                </Button>
                                <p className="text-xs text-muted-foreground mt-4">
                                    Pagamento processado de forma segura. Garantia de 7 dias ou seu dinheiro de volta.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
