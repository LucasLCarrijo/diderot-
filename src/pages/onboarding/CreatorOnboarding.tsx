import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { SiteHeader } from "@/components/site/SiteHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Sparkles,
  TrendingUp,
  BarChart3,
  DollarSign,
  Instagram,
  Youtube,
  Globe,
  Loader2,
} from "lucide-react";

const STEPS = [
  { id: 1, title: "Bem-vindo" },
  { id: 2, title: "Handle" },
  { id: 3, title: "Bio" },
  { id: 4, title: "Categorias" },
  { id: 5, title: "Redes Sociais" },
  { id: 6, title: "Finalização" },
];

const CATEGORIES = [
  { id: "fashion", label: "Moda", icon: "👗" },
  { id: "beauty", label: "Beleza", icon: "💄" },
  { id: "tech", label: "Tecnologia", icon: "📱" },
  { id: "food", label: "Comida", icon: "🍽️" },
  { id: "fitness", label: "Fitness", icon: "💪" },
  { id: "travel", label: "Viagem", icon: "✈️" },
  { id: "lifestyle", label: "Lifestyle", icon: "🌿" },
  { id: "home", label: "Casa", icon: "🏠" },
  { id: "gaming", label: "Games", icon: "🎮" },
  { id: "music", label: "Música", icon: "🎵" },
];

export default function CreatorOnboarding() {
  const [step, setStep] = useState(1);
  const [handle, setHandle] = useState("");
  const [handleAvailable, setHandleAvailable] = useState<boolean | null>(null);
  const [checkingHandle, setCheckingHandle] = useState(false);
  const [bio, setBio] = useState("");
  const [categories, setCategories] = useState<string[]>([]);
  const [instagram, setInstagram] = useState("");
  const [tiktok, setTiktok] = useState("");
  const [youtube, setYoutube] = useState("");
  const [website, setWebsite] = useState("");

  const { user, refreshSession } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const progress = (step / STEPS.length) * 100;

  // Check if creator already has products (shop) and redirect if they do
  const { data: profile } = useQuery({
    queryKey: ["profile-for-onboarding-check", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user?.id,
  });

  const { data: productCount = 0 } = useQuery({
    queryKey: ["product-count-for-onboarding", profile?.id],
    queryFn: async () => {
      if (!profile?.id) return 0;
      const { count } = await supabase
        .from("products")
        .select("*", { count: "exact", head: true })
        .eq("creator_id", profile.id);
      return count || 0;
    },
    enabled: !!profile?.id,
  });

  // Redirect if creator already has products
  useEffect(() => {
    if (productCount > 0) {
      navigate("/creator/shop", { replace: true });
    }
  }, [productCount, navigate]);

  // Check handle availability
  const checkHandle = async (value: string) => {
    if (!value || value.length < 3) {
      setHandleAvailable(null);
      return;
    }

    setCheckingHandle(true);
    try {
      const { data } = await supabase
        .from("profiles")
        .select("id")
        .eq("username", value.toLowerCase())
        .maybeSingle();

      setHandleAvailable(!data);
    } catch {
      setHandleAvailable(null);
    } finally {
      setCheckingHandle(false);
    }
  };

  // Create creator profile mutation
  const createProfile = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Não autenticado");

      // Create profile
      const { error: profileError } = await supabase.from("profiles").upsert({
        id: user.id,
        user_id: user.id,
        username: handle.toLowerCase(),
        name: user.user_metadata?.name || handle,
        bio,
        categories,
        instagram_url: instagram ? `https://instagram.com/${instagram.replace("@", "")}` : null,
        tiktok_url: tiktok ? `https://tiktok.com/@${tiktok.replace("@", "")}` : null,
        youtube_url: youtube || null,
        website_url: website || null,
      });

      if (profileError) throw profileError;

      // Add creator role
      const { error: roleError } = await supabase.from("user_roles").upsert({
        user_id: user.id,
        role: "creator",
      });

      if (roleError) throw roleError;
    },
    onSuccess: async () => {
      await refreshSession();
      queryClient.invalidateQueries({ queryKey: ["my-profile"] });
      toast.success("Bem-vindo! Crie seu primeiro produto.");
      navigate("/creator/shop");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao criar perfil");
    },
  });

  const handleCategoryToggle = (catId: string) => {
    if (categories.includes(catId)) {
      setCategories(categories.filter((c) => c !== catId));
    } else if (categories.length < 5) {
      setCategories([...categories, catId]);
    }
  };

  const canProceed = () => {
    switch (step) {
      case 2:
        return handle.length >= 3 && handleAvailable;
      case 3:
        return bio.length >= 10;
      case 4:
        return categories.length >= 1;
      case 5:
        return instagram || tiktok || youtube || website;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (step < STEPS.length) {
      setStep(step + 1);
    } else {
      createProfile.mutate();
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  // Show loading while checking if creator has products
  if (profile && productCount > 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <div className="container max-w-2xl py-8">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
            <span>Passo {step} de {STEPS.length}</span>
            <span>{STEPS[step - 1].title}</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Step Content */}
        <div className="bg-card rounded-2xl border p-6 md:p-8 animate-fade-in">
          {/* Step 1: Welcome */}
          {step === 1 && (
            <div className="text-center space-y-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                <Sparkles className="h-8 w-8 text-primary" />
              </div>
              <h1 className="text-3xl font-sans font-semibold">
                Vire um Creator no Diderot!
              </h1>
              <p className="text-muted-foreground max-w-md mx-auto">
                Conecte-se com seus seguidores compartilhando os produtos que você ama.
              </p>

              <div className="grid grid-cols-2 gap-4 text-left mt-8">
                <div className="flex items-start gap-3 p-4 rounded-lg bg-secondary/50">
                  <DollarSign className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium">Monetize com afiliados</p>
                    <p className="text-sm text-muted-foreground">Ganhe comissões em cada venda</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 rounded-lg bg-secondary/50">
                  <TrendingUp className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium">Cresça sua audiência</p>
                    <p className="text-sm text-muted-foreground">Atraia novos seguidores</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 rounded-lg bg-secondary/50">
                  <BarChart3 className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium">Analytics detalhado</p>
                    <p className="text-sm text-muted-foreground">Acompanhe seu desempenho</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 rounded-lg bg-secondary/50">
                  <Sparkles className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium">Ganhe com campanhas</p>
                    <p className="text-sm text-muted-foreground">Trabalhe com marcas (em breve)</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Handle */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-sans font-semibold mb-2">
                  Escolha seu handle
                </h2>
                <p className="text-muted-foreground">
                  Este será seu nome de usuário único no Diderot
                </p>
              </div>

              <div className="space-y-4 max-w-md mx-auto">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    @
                  </span>
                  <Input
                    value={handle}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^a-zA-Z0-9-]/g, "").toLowerCase();
                      setHandle(value);
                      checkHandle(value);
                    }}
                    placeholder="seuhandle"
                    className="pl-9 text-lg h-12"
                    maxLength={30}
                  />
                  {checkingHandle && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin" />
                  )}
                  {!checkingHandle && handleAvailable === true && (
                    <Check className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
                  )}
                </div>

                {handle && (
                  <p className={`text-sm ${handleAvailable ? "text-green-600" : handleAvailable === false ? "text-destructive" : "text-muted-foreground"}`}>
                    {handleAvailable === null && "Digite pelo menos 3 caracteres"}
                    {handleAvailable === true && "✓ Handle disponível!"}
                    {handleAvailable === false && "✗ Handle já em uso"}
                  </p>
                )}

                <p className="text-sm text-muted-foreground text-center">
                  Seu perfil será: <span className="font-medium">diderot.com/@{handle || "seuhandle"}</span>
                </p>
              </div>
            </div>
          )}

          {/* Step 3: Bio */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-sans font-semibold mb-2">
                  Conte sobre você
                </h2>
                <p className="text-muted-foreground">
                  Uma bio curta que descreva o que você recomenda
                </p>
              </div>

              <div className="space-y-4 max-w-md mx-auto">
                <div className="space-y-2">
                  <Textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Compartilho meus produtos favoritos de moda, beleza e lifestyle..."
                    className="min-h-[120px] resize-none"
                    maxLength={500}
                  />
                  <p className="text-xs text-muted-foreground text-right">
                    {bio.length}/500 caracteres
                  </p>
                </div>

                <div className="bg-secondary/50 rounded-lg p-4">
                  <p className="text-sm font-medium mb-2">💡 Dica:</p>
                  <p className="text-sm text-muted-foreground">
                    Conte o que você recomenda e por quê seus seguidores devem te acompanhar aqui.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Categories */}
          {step === 4 && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-sans font-semibold mb-2">
                  Quais são suas categorias?
                </h2>
                <p className="text-muted-foreground">
                  Selecione de 1 a 5 categorias que você mais recomenda
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => handleCategoryToggle(cat.id)}
                    className={`flex items-center gap-2 p-3 rounded-lg border transition-all ${
                      categories.includes(cat.id)
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <span className="text-xl">{cat.icon}</span>
                    <span className="font-medium">{cat.label}</span>
                    {categories.includes(cat.id) && <Check className="h-4 w-4 ml-auto" />}
                  </button>
                ))}
              </div>

              <p className="text-sm text-center text-muted-foreground">
                {categories.length}/5 categorias selecionadas
              </p>
            </div>
          )}

          {/* Step 5: Social */}
          {step === 5 && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-sans font-semibold mb-2">
                  Onde seus seguidores te encontram?
                </h2>
                <p className="text-muted-foreground">
                  Adicione pelo menos uma rede social
                </p>
              </div>

              <div className="space-y-4 max-w-md mx-auto">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Instagram className="h-4 w-4" />
                    Instagram
                  </Label>
                  <Input
                    value={instagram}
                    onChange={(e) => setInstagram(e.target.value)}
                    placeholder="@seuinstagram"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                    </svg>
                    TikTok
                  </Label>
                  <Input
                    value={tiktok}
                    onChange={(e) => setTiktok(e.target.value)}
                    placeholder="@seutiktok"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Youtube className="h-4 w-4" />
                    YouTube
                  </Label>
                  <Input
                    value={youtube}
                    onChange={(e) => setYoutube(e.target.value)}
                    placeholder="https://youtube.com/@seucanal"
                    type="url"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    Website
                  </Label>
                  <Input
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder="https://seusite.com"
                    type="url"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 6: Finish */}
          {step === 6 && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/20 mb-4">
                  <Check className="h-8 w-8 text-green-600" />
                </div>
                <h2 className="text-2xl font-sans font-semibold mb-2">
                  Tudo pronto!
                </h2>
                <p className="text-muted-foreground">
                  Confira o resumo do seu perfil
                </p>
              </div>

              <div className="bg-secondary/50 rounded-xl p-6 space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Handle</p>
                  <p className="font-medium">@{handle}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Bio</p>
                  <p className="font-medium">{bio}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Categorias</p>
                  <div className="flex flex-wrap gap-2">
                    {categories.map((cat) => {
                      const category = CATEGORIES.find((c) => c.id === cat);
                      return (
                        <Badge key={cat} variant="secondary">
                          {category?.icon} {category?.label}
                        </Badge>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <Check className="h-4 w-4 text-green-500" />
                  <span>Crie até 15 produtos (Free)</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Check className="h-4 w-4 text-green-500" />
                  <span>Crie até 3 coleções (Free)</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Check className="h-4 w-4 text-green-500" />
                  <span>Monetize com afiliados</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <div className="h-4 w-4 rounded border" />
                  <span>Analytics detalhado (Upgrade Pro)</span>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t">
            {step > 1 ? (
              <Button variant="ghost" onClick={handleBack}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
            ) : (
              <div />
            )}

            <Button
              onClick={handleNext}
              disabled={!canProceed() || createProfile.isPending}
              className="min-w-[140px]"
            >
              {createProfile.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Criando...
                </>
              ) : step === STEPS.length ? (
                <>
                  Completar cadastro
                  <Check className="h-4 w-4 ml-2" />
                </>
              ) : (
                <>
                  {step === 1 ? "Começar" : "Continuar"}
                  <ArrowRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
