import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useMyProfile } from "@/hooks/useProfile";
import { CreatorLayout } from "@/components/layout/CreatorLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { AvatarUploadButton } from "@/components/ui/AvatarUploadButton";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  ArrowLeft,
  Check,
  ExternalLink,
  Instagram,
  Youtube,
  Globe,
  Loader2,
} from "lucide-react";

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

export default function CreatorProfileEdit() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: profile, isLoading: profileLoading } = useMyProfile();

  const [name, setName] = useState("");
  const [handle, setHandle] = useState("");
  const [bio, setBio] = useState("");
  const [categories, setCategories] = useState<string[]>([]);
  const [instagram, setInstagram] = useState("");
  const [tiktok, setTiktok] = useState("");
  const [youtube, setYoutube] = useState("");
  const [website, setWebsite] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [handleAvailable, setHandleAvailable] = useState<boolean | null>(null);
  const [checkingHandle, setCheckingHandle] = useState(false);

  // Load profile data
  useEffect(() => {
    if (profile) {
      setName(profile.name || "");
      setHandle(profile.username || "");
      setBio(profile.bio || "");
      setCategories((profile as any).categories || []);
      setInstagram(profile.instagram_url?.replace("https://instagram.com/", "@") || "");
      setTiktok(profile.tiktok_url?.replace("https://tiktok.com/@", "@") || "");
      setYoutube(profile.youtube_url || "");
      setWebsite(profile.website_url || "");
      setAvatarUrl(profile.avatar_url || null);
    }
  }, [profile]);

  const checkHandle = async (value: string) => {
    if (!value || value.length < 3 || value === profile?.username) {
      setHandleAvailable(value === profile?.username ? true : null);
      return;
    }

    setCheckingHandle(true);
    try {
      const { data } = await supabase
        .from("profiles")
        .select("id")
        .eq("username", value.toLowerCase())
        .neq("id", user?.id || "")
        .maybeSingle();

      setHandleAvailable(!data);
    } catch {
      setHandleAvailable(null);
    } finally {
      setCheckingHandle(false);
    }
  };

  const updateProfile = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Não autenticado");

      const { error } = await supabase
        .from("profiles")
        .update({
          name,
          username: handle.toLowerCase(),
          bio,
          categories,
          avatar_url: avatarUrl,
          instagram_url: instagram ? `https://instagram.com/${instagram.replace("@", "")}` : null,
          tiktok_url: tiktok ? `https://tiktok.com/@${tiktok.replace("@", "")}` : null,
          youtube_url: youtube || null,
          website_url: website || null,
        })
        .eq("id", user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-profile"] });
      toast.success("Perfil atualizado com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao atualizar perfil");
    },
  });

  const handleCategoryToggle = (catId: string) => {
    if (categories.includes(catId)) {
      setCategories(categories.filter((c) => c !== catId));
    } else if (categories.length < 5) {
      setCategories([...categories, catId]);
    }
  };

  const canSave = () => {
    return (
      name.length >= 2 &&
      handle.length >= 3 &&
      (handleAvailable !== false) &&
      bio.length >= 10
    );
  };

  if (profileLoading) {
    return (
      <CreatorLayout title="Editar Perfil">
        <div className="max-w-2xl mx-auto space-y-6">
          <Skeleton className="h-24 w-24 rounded-full mx-auto" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </CreatorLayout>
    );
  }

  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "?";

  return (
    <CreatorLayout title="Editar Perfil">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(`/${handle}`, "_blank")}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Pré-visualizar
          </Button>
        </div>

        <div className="space-y-8">
          {/* Avatar */}
          <div className="flex flex-col items-center gap-4">
            <AvatarUploadButton 
              currentAvatarUrl={avatarUrl}
              userName={name || profile?.name}
              onUploadComplete={(url) => {
                setAvatarUrl(url);
              }}
            />
          </div>

          {/* Basic Info */}
          <div className="space-y-4">
            <h3 className="font-medium text-lg">Informações básicas</h3>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Nome</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Seu nome"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="handle">Handle</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    @
                  </span>
                  <Input
                    id="handle"
                    value={handle}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^a-zA-Z0-9-]/g, "").toLowerCase();
                      setHandle(value);
                      checkHandle(value);
                    }}
                    className="pl-9"
                    placeholder="seuhandle"
                  />
                  {checkingHandle && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin" />
                  )}
                  {!checkingHandle && handleAvailable === true && (
                    <Check className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
                  )}
                </div>
                {handleAvailable === false && (
                  <p className="text-sm text-destructive">Handle já em uso</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Conte sobre você e o que você recomenda..."
                className="min-h-[100px] resize-none"
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground text-right">
                {bio.length}/500
              </p>
            </div>
          </div>

          {/* Categories */}
          <div className="space-y-4">
            <h3 className="font-medium text-lg">Categorias</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => handleCategoryToggle(cat.id)}
                  className={`flex items-center gap-2 p-3 rounded-lg border transition-all ${
                    categories.includes(cat.id)
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <span className="text-lg">{cat.icon}</span>
                  <span className="font-medium text-sm">{cat.label}</span>
                  {categories.includes(cat.id) && <Check className="h-4 w-4 ml-auto" />}
                </button>
              ))}
            </div>
            <p className="text-sm text-muted-foreground">
              {categories.length}/5 categorias selecionadas
            </p>
          </div>

          {/* Social */}
          <div className="space-y-4">
            <h3 className="font-medium text-lg">Redes Sociais</h3>

            <div className="grid gap-4 sm:grid-cols-2">
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

          {/* Actions */}
          <div className="flex items-center justify-end gap-4 pt-6 border-t">
            <Button variant="outline" onClick={() => navigate(-1)}>
              Cancelar
            </Button>
            <Button
              onClick={() => updateProfile.mutate()}
              disabled={!canSave() || updateProfile.isPending}
            >
              {updateProfile.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                "Salvar alterações"
              )}
            </Button>
          </div>
        </div>
      </div>
    </CreatorLayout>
  );
}
