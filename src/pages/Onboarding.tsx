import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Eye,
  Loader2,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { SiteHeader } from "@/components/site/SiteHeader";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { STRIPE_PRICES } from "@/lib/stripe-config";
import { toast } from "sonner";

type UserType = "creator" | "follower" | null;
type Plan = "monthly" | "annual";

const STEP_LABELS = ["Tipo de conta", "Cadastro", "Plano", "Ativação"] as const;

// Detect post-Stripe return
function isPostPaymentReturn(params: URLSearchParams) {
  return params.get("success") === "true";
}

export default function Onboarding() {
  const { user, signUp, session } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const postPayment = isPostPaymentReturn(searchParams);

  // Start at step 4 if returning from Stripe
  const [step, setStep] = useState<1 | 2 | 3 | 4>(postPayment ? 4 : 1);
  const [userType, setUserType] = useState<UserType>(null);
  const [plan, setPlan] = useState<Plan>("annual");

  // Form fields
  const [username, setUsername] = useState("");
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);

  const [submitting, setSubmitting] = useState(false);

  // If logged-in creator with active sub → redirect to shop
  useEffect(() => {
    if (!user) return;
    if (postPayment) return; // stay at step 4
    supabase
      .from("subscriptions")
      .select("status")
      .eq("user_id", user.id)
      .in("status", ["active", "trialing"])
      .maybeSingle()
      .then(({ data }) => {
        if (data) navigate("/creator/shop", { replace: true });
      });
  }, [user, postPayment, navigate]);

  const progress = (step / STEP_LABELS.length) * 100;

  // Username availability check
  const checkUsername = async (value: string) => {
    if (!value || value.length < 3) {
      setUsernameAvailable(null);
      return;
    }
    setCheckingUsername(true);
    try {
      const { data } = await supabase
        .from("profiles")
        .select("id")
        .eq("username", value.toLowerCase())
        .maybeSingle();
      setUsernameAvailable(!data);
    } finally {
      setCheckingUsername(false);
    }
  };

  // Validation per step
  const canAdvance = () => {
    switch (step) {
      case 1:
        return userType !== null;
      case 2:
        if (userType === "creator") {
          return (
            username.length >= 3 &&
            usernameAvailable === true &&
            name.trim().length >= 2 &&
            email.includes("@") &&
            password.length >= 8 &&
            termsAccepted
          );
        }
        return email.includes("@") && password.length >= 8 && termsAccepted;
      case 3:
        return true; // plan already selected
      default:
        return true;
    }
  };

  // --- Submit handlers ---

  async function handleFollowerSignUp() {
    setSubmitting(true);
    try {
      const { error } = await signUp(email, password);
      if (error) throw error;
      // Set role to follower in profiles after sign-up
      // (profile will be created by trigger; role defaults to 'follower')
      toast.success("Conta criada! Bem-vindo ao Diderot.");
      navigate("/me/feed");
    } catch (err) {
      toast.error((err as Error).message || "Erro ao criar conta");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCreatorCheckout() {
    setSubmitting(true);
    try {
      let accessToken = session?.access_token;

      // Sign up if not yet authenticated
      if (!user) {
        const { error: signUpError } = await signUp(email, password, name, username, phone || undefined);
        if (signUpError) throw signUpError;

        // Wait briefly for session to settle
        await new Promise((r) => setTimeout(r, 1200));

        const { data: { session: newSession } } = await supabase.auth.getSession();
        accessToken = newSession?.access_token;

        if (!accessToken) {
          // Email confirmation required — tell user
          toast.info(
            "Verifique seu e-mail para confirmar a conta e depois volte aqui para assinar.",
            { duration: 8000 }
          );
          return;
        }

        // Create profile with role and handle
        await supabase.from("profiles").upsert({
          id: newSession!.user.id,
          user_id: newSession!.user.id,
          username: username.toLowerCase(),
          name,
          role: "creator",
          categories: [],
        });
      }

      // Kick off Stripe checkout
      const priceId =
        plan === "annual"
          ? STRIPE_PRICES.CREATOR_PRO_YEARLY
          : STRIPE_PRICES.CREATOR_PRO_MONTHLY;

      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { priceId, returnUrl: `${window.location.origin}/onboarding?success=true` },
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (error) {
        // Extract the real error message from the response body
        let errorMessage = error.message;
        try {
          const body = await (error as { context?: Response }).context?.json?.();
          if (body?.error) errorMessage = body.error;
        } catch {}
        throw new Error(errorMessage);
      }
      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error("Sem URL de checkout");
      }
    } catch (err) {
      toast.error((err as Error).message || "Erro ao iniciar checkout");
    } finally {
      setSubmitting(false);
    }
  }

  function handleNext() {
    if (step === 2 && userType === "follower") {
      handleFollowerSignUp();
      return;
    }
    if (step === 3) {
      handleCreatorCheckout();
      return;
    }
    if (step === 4) {
      navigate("/creator/shop");
      return;
    }
    setStep((s) => (s + 1) as 1 | 2 | 3 | 4);
  }

  function handleBack() {
    if (step > 1) setStep((s) => (s - 1) as 1 | 2 | 3 | 4);
  }

  // ---- Render steps ----
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <div className="container max-w-2xl py-8">
        {/* Progress bar (hide on step 4) */}
        {step < 4 && (
          <div className="mb-8">
            <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
              <span>Passo {step} de {STEP_LABELS.length - 1}</span>
              <span>{STEP_LABELS[step - 1]}</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        <div className="bg-card rounded-2xl border p-6 md:p-8 animate-fade-in">
          {/* ── STEP 1: Profile type ── */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">
                  Como você quer usar o Diderot?
                </h1>
                <p className="text-muted-foreground text-lg">
                  Escolha a experiência ideal para você.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <Card
                  className={`p-6 cursor-pointer border-2 transition-all hover:shadow-md text-center space-y-3 ${
                    userType === "creator"
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                  onClick={() => setUserType("creator")}
                >
                  <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
                    <Sparkles className="h-7 w-7 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold">Sou Creator</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Quero monetizar meu conteúdo com links de afiliado
                    </p>
                  </div>
                  {userType === "creator" && (
                    <div className="inline-flex items-center gap-1 text-xs text-primary font-medium">
                      <Check className="h-3.5 w-3.5" /> Selecionado
                    </div>
                  )}
                </Card>

                <Card
                  className={`p-6 cursor-pointer border-2 transition-all hover:shadow-md text-center space-y-3 ${
                    userType === "follower"
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                  onClick={() => setUserType("follower")}
                >
                  <div className="h-14 w-14 rounded-2xl bg-secondary flex items-center justify-center mx-auto">
                    <Eye className="h-7 w-7 text-foreground" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold">Sou Seguidor</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Quero descobrir creators e produtos incríveis
                    </p>
                  </div>
                  {userType === "follower" && (
                    <div className="inline-flex items-center gap-1 text-xs text-primary font-medium">
                      <Check className="h-3.5 w-3.5" /> Selecionado
                    </div>
                  )}
                </Card>
              </div>
            </div>
          )}

          {/* ── STEP 2: Registration ── */}
          {step === 2 && (
            <div className="space-y-5">
              <div className="text-center space-y-1">
                <h2 className="text-2xl font-bold">
                  {userType === "creator" ? "Crie sua conta Creator" : "Crie sua conta"}
                </h2>
                <p className="text-muted-foreground text-sm">
                  {userType === "creator"
                    ? "Preencha os dados para criar sua loja"
                    : "Preencha os dados para começar"}
                </p>
              </div>

              <div className="space-y-4 max-w-md mx-auto">
                {userType === "creator" && (
                  <>
                    <div className="space-y-1.5">
                      <Label>Seu handle (URL da loja)</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                          @
                        </span>
                        <Input
                          value={username}
                          onChange={(e) => {
                            const v = e.target.value.replace(/[^a-zA-Z0-9-]/g, "").toLowerCase();
                            setUsername(v);
                            checkUsername(v);
                          }}
                          placeholder="seuhandle"
                          className="pl-8"
                          maxLength={30}
                        />
                        {checkingUsername && (
                          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin" />
                        )}
                        {!checkingUsername && usernameAvailable === true && (
                          <Check className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
                        )}
                      </div>
                      {username.length >= 3 && (
                        <p className={`text-xs ${usernameAvailable ? "text-green-600" : "text-destructive"}`}>
                          {usernameAvailable ? "Handle disponível!" : "Handle já em uso"}
                        </p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <Label>Nome completo</Label>
                      <Input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Seu Nome"
                      />
                    </div>
                  </>
                )}

                <div className="space-y-1.5">
                  <Label>E-mail</Label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="voce@email.com"
                  />
                </div>

                {userType === "creator" && (
                  <div className="space-y-1.5">
                    <Label>Celular (opcional)</Label>
                    <Input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+55 11 99999-9999"
                    />
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label>Senha</Label>
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo 8 caracteres"
                  />
                </div>

                <div className="flex items-start gap-2.5 pt-1">
                  <Checkbox
                    id="terms"
                    checked={termsAccepted}
                    onCheckedChange={(v) => setTermsAccepted(!!v)}
                  />
                  <label htmlFor="terms" className="text-sm text-muted-foreground cursor-pointer leading-snug">
                    Concordo com os{" "}
                    <a href="/terms" className="text-primary underline" target="_blank" rel="noopener noreferrer">
                      Termos de Serviço
                    </a>{" "}
                    e a{" "}
                    <a href="/privacy" className="text-primary underline" target="_blank" rel="noopener noreferrer">
                      Política de Privacidade
                    </a>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 3: Plan (creator only) ── */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold">Escolha seu plano</h2>
                <p className="text-muted-foreground">
                  14 dias grátis para testar. Cancele quando quiser.
                </p>
              </div>

              <div className="space-y-3 max-w-md mx-auto">
                {/* Annual */}
                <Card
                  className={`p-5 cursor-pointer border-2 transition-all relative ${
                    plan === "annual"
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                  onClick={() => setPlan("annual")}
                >
                  <div className="absolute -top-3 right-4">
                    <span className="bg-green-500 text-white text-xs font-semibold px-2.5 py-0.5 rounded-full">
                      Economize 2 meses!
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-lg">Anual</p>
                      <p className="text-sm text-muted-foreground">Melhor valor</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold">R$ 299,90</p>
                      <p className="text-sm text-muted-foreground">/ano</p>
                    </div>
                    <div
                      className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ml-3 ${
                        plan === "annual" ? "border-primary" : "border-muted-foreground"
                      }`}
                    >
                      {plan === "annual" && <div className="h-2.5 w-2.5 rounded-full bg-primary" />}
                    </div>
                  </div>
                </Card>

                {/* Monthly */}
                <Card
                  className={`p-5 cursor-pointer border-2 transition-all ${
                    plan === "monthly"
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                  onClick={() => setPlan("monthly")}
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
                    <div
                      className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ml-3 ${
                        plan === "monthly" ? "border-primary" : "border-muted-foreground"
                      }`}
                    >
                      {plan === "monthly" && <div className="h-2.5 w-2.5 rounded-full bg-primary" />}
                    </div>
                  </div>
                </Card>
              </div>

              <p className="text-center text-xs text-muted-foreground">
                Pagamento seguro via Stripe. Garantia de 7 dias ou seu dinheiro de volta.
              </p>
            </div>
          )}

          {/* ── STEP 4: Activation (post-payment) ── */}
          {step === 4 && (
            <div className="text-center space-y-6 py-4">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/20 mx-auto">
                <Check className="h-10 w-10 text-green-600" />
              </div>
              <div className="space-y-3">
                <h2 className="text-3xl font-bold">Sua loja está pronta!</h2>
                <p className="text-muted-foreground text-lg max-w-sm mx-auto">
                  Configure seus produtos e comece a ganhar agora mesmo.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                <Button size="lg" onClick={() => navigate("/creator/shop")} className="gap-2">
                  Quero começar!
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </div>
            </div>
          )}

          {/* ── Navigation ── */}
          {step < 4 && (
            <div className="flex items-center justify-between mt-8 pt-6 border-t">
              {step > 1 ? (
                <Button variant="ghost" onClick={handleBack} disabled={submitting}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar
                </Button>
              ) : (
                <div />
              )}

              <Button
                onClick={handleNext}
                disabled={!canAdvance() || submitting}
                className="min-w-[160px]"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Aguarde...
                  </>
                ) : step === 2 && userType === "follower" ? (
                  <>
                    Criar conta
                    <Check className="h-4 w-4 ml-2" />
                  </>
                ) : step === 3 ? (
                  <>
                    Comece seu teste de 14 dias
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                ) : (
                  <>
                    {step === 1 ? "Continuar" : "Próximo"}
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
