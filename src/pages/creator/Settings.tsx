import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CreatorLayout } from "@/components/layout/CreatorLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEntitlements } from "@/hooks/useEntitlements";
import { useSubscription } from "@/hooks/useSubscription";
import { User, Bell, Shield, ExternalLink, Sparkles, CreditCard, CheckCircle, Pencil, X } from "lucide-react";

export default function CreatorSettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { hasCreatorPro } = useEntitlements();
  const { subscriptionEnd, cancelAtPeriodEnd, isLoading: isLoadingSubscription } = useSubscription();

  // Edit mode state
  const [isEditing, setIsEditing] = useState(false);

  const { data: profile, isLoading } = useQuery({
    queryKey: ["creator-profile", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Form data initialized from profile
  const [formData, setFormData] = useState({
    name: "",
    bio: "",
    instagram_url: "",
    tiktok_url: "",
    youtube_url: "",
    website_url: "",
  });

  // Backup for cancel functionality
  const [originalData, setOriginalData] = useState(formData);

  // Sync form data when profile loads
  useEffect(() => {
    if (profile) {
      const data = {
        name: profile.name || "",
        bio: profile.bio || "",
        instagram_url: profile.instagram_url || "",
        tiktok_url: profile.tiktok_url || "",
        youtube_url: profile.youtube_url || "",
        website_url: profile.website_url || "",
      };
      setFormData(data);
      setOriginalData(data);
    }
  }, [profile]);

  const updateProfile = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (!user?.id) throw new Error("User not authenticated");
      
      const { error } = await supabase
        .from("profiles")
        .update({
          name: data.name,
          bio: data.bio,
          instagram_url: data.instagram_url || null,
          tiktok_url: data.tiktok_url || null,
          youtube_url: data.youtube_url || null,
          website_url: data.website_url || null,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["creator-profile"] });
      setOriginalData(formData);
      setIsEditing(false);
      toast({
        title: "Perfil atualizado",
        description: "Suas alterações foram salvas com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao salvar",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile.mutate(formData);
  };

  const handleCancel = () => {
    setFormData(originalData);
    setIsEditing(false);
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  // Loading state with skeleton
  if (isLoading) {
    return (
      <CreatorLayout
        title="Configurações"
        description="Gerencie seu perfil de creator e preferências"
      >
        <div className="space-y-6 max-w-2xl">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-48" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-24 w-full" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
        </div>
      </CreatorLayout>
    );
  }

  return (
    <CreatorLayout
      title="Configurações"
      description="Gerencie seu perfil de creator e preferências"
      actions={
        !isEditing ? (
          <Button onClick={handleEdit} variant="outline" size="sm">
            <Pencil className="h-4 w-4 mr-2" />
            Editar perfil
          </Button>
        ) : null
      }
    >
      <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
        {/* Profile Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Perfil Público
            </CardTitle>
            <CardDescription>
              Informações visíveis para seus seguidores
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome de exibição</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Seu nome"
                disabled={!isEditing}
                className={!isEditing ? "bg-muted" : ""}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                placeholder="Conte um pouco sobre você..."
                rows={4}
                disabled={!isEditing}
                className={!isEditing ? "bg-muted resize-none" : "resize-none"}
              />
            </div>
          </CardContent>
        </Card>

        {/* Social Links */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ExternalLink className="h-5 w-5" />
              Redes Sociais
            </CardTitle>
            <CardDescription>
              Links para suas redes sociais
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="instagram">Instagram</Label>
              <Input
                id="instagram"
                value={formData.instagram_url}
                onChange={(e) => setFormData({ ...formData, instagram_url: e.target.value })}
                placeholder="https://instagram.com/seu_usuario"
                disabled={!isEditing}
                className={!isEditing ? "bg-muted" : ""}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tiktok">TikTok</Label>
              <Input
                id="tiktok"
                value={formData.tiktok_url}
                onChange={(e) => setFormData({ ...formData, tiktok_url: e.target.value })}
                placeholder="https://tiktok.com/@seu_usuario"
                disabled={!isEditing}
                className={!isEditing ? "bg-muted" : ""}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="youtube">YouTube</Label>
              <Input
                id="youtube"
                value={formData.youtube_url}
                onChange={(e) => setFormData({ ...formData, youtube_url: e.target.value })}
                placeholder="https://youtube.com/@seu_canal"
                disabled={!isEditing}
                className={!isEditing ? "bg-muted" : ""}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                value={formData.website_url}
                onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
                placeholder="https://seusite.com"
                disabled={!isEditing}
                className={!isEditing ? "bg-muted" : ""}
              />
            </div>
          </CardContent>
        </Card>

        {/* Notifications - always viewable */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notificações
            </CardTitle>
            <CardDescription>
              Configure como você quer ser notificado
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Novo seguidor</Label>
                <p className="text-sm text-muted-foreground">
                  Receber notificação quando alguém começar a seguir você
                </p>
              </div>
              <Switch defaultChecked disabled={!isEditing} />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <Label>Produto favoritado</Label>
                <p className="text-sm text-muted-foreground">
                  Receber notificação quando favoritarem seus produtos
                </p>
              </div>
              <Switch defaultChecked disabled={!isEditing} />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <Label>Resumo semanal</Label>
                <p className="text-sm text-muted-foreground">
                  Receber um resumo semanal do seu desempenho por email
                </p>
              </div>
              <Switch disabled={!isEditing} />
            </div>
          </CardContent>
        </Card>

        {/* Privacy - always viewable */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Privacidade
            </CardTitle>
            <CardDescription>
              Controle a visibilidade do seu perfil
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Perfil público</Label>
                <p className="text-sm text-muted-foreground">
                  Permitir que qualquer pessoa veja seu perfil e produtos
                </p>
              </div>
              <Switch defaultChecked disabled={!isEditing} />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <Label>Mostrar estatísticas</Label>
                <p className="text-sm text-muted-foreground">
                  Exibir número de seguidores e cliques publicamente
                </p>
              </div>
              <Switch defaultChecked disabled={!isEditing} />
            </div>
          </CardContent>
        </Card>

        {/* Subscription Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Assinatura
            </CardTitle>
            <CardDescription>
              Gerencie seu plano Creator Pro
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoadingSubscription ? (
              <div className="animate-pulse space-y-3">
                <div className="h-6 bg-muted rounded w-32" />
                <div className="h-4 bg-muted rounded w-48" />
              </div>
            ) : hasCreatorPro ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Badge className="bg-primary/10 text-primary hover:bg-primary/20">
                    <Sparkles className="h-3 w-3 mr-1" />
                    Creator Pro
                  </Badge>
                  {cancelAtPeriodEnd && (
                    <Badge variant="outline" className="text-amber-600 border-amber-600">
                      Cancela em breve
                    </Badge>
                  )}
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    Produtos ilimitados
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    Coleções ilimitadas
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    Analytics avançado
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    Badge de verificação
                  </div>
                </div>

                {subscriptionEnd && (
                  <p className="text-sm text-muted-foreground">
                    {cancelAtPeriodEnd ? "Acesso até" : "Próxima cobrança em"}:{" "}
                    <span className="font-medium">
                      {new Date(subscriptionEnd).toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "long",
                        year: "numeric",
                      })}
                    </span>
                  </p>
                )}

                <Button variant="outline" onClick={() => navigate("/creator/billing")}>
                  Gerenciar assinatura
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">Plano Gratuito</Badge>
                </div>
                
                <p className="text-sm text-muted-foreground">
                  Faça upgrade para Creator Pro e desbloqueie produtos ilimitados, 
                  analytics avançado e muito mais.
                </p>

                <Button onClick={() => navigate("/creator/pricing")} className="gap-2">
                  <Sparkles className="h-4 w-4" />
                  Fazer upgrade
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Edit mode action buttons */}
        {isEditing && (
          <div className="flex justify-end gap-4 pt-2">
            <Button variant="outline" type="button" onClick={handleCancel}>
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
            <Button type="submit" disabled={updateProfile.isPending}>
              {updateProfile.isPending ? "Salvando..." : "Salvar alterações"}
            </Button>
          </div>
        )}
      </form>
    </CreatorLayout>
  );
}
