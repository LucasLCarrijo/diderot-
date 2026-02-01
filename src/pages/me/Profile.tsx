import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { UserLayout } from "@/components/layout/UserLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { useMyProfile, useUpdateProfile } from "@/hooks/useProfile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AvatarUploadButton } from "@/components/ui/AvatarUploadButton";
import { UserStats } from "@/components/me/UserStats";
import { ChangePasswordModal } from "@/components/me/ChangePasswordModal";
import { DeleteAccountModal } from "@/components/me/DeleteAccountModal";
import { Sparkles, AlertCircle, Settings, Shield, Key, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";

const profileSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  username: z.string()
    .min(3, "Username deve ter pelo menos 3 caracteres")
    .max(30, "Username deve ter no máximo 30 caracteres")
    .regex(/^[a-zA-Z0-9_-]+$/, "Username só pode conter letras, números, _ e -"),
  bio: z.string().max(500, "Bio deve ter no máximo 500 caracteres").optional(),
  avatar_url: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function Profile() {
  const { user, userRoles, hasRole, switchRole } = useAuth();
  const { loading } = useRequireAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { data: profile, isLoading: profileLoading } = useMyProfile();
  const updateProfile = useUpdateProfile();
  const [isSwitchingRole, setIsSwitchingRole] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Show error from URL params (e.g., role_required)
  const errorMessage = searchParams.get("message");

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
    watch,
    setValue,
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: "",
      username: "",
      bio: "",
      avatar_url: "",
    },
  });

  const avatarUrl = watch("avatar_url");
  const name = watch("name");
  const bio = watch("bio") || "";

  useEffect(() => {
    if (profile) {
      reset({
        name: profile.name || "",
        username: profile.username || "",
        bio: profile.bio || "",
        avatar_url: profile.avatar_url || "",
      });
    }
  }, [profile, reset]);

  const onSubmit = (data: ProfileFormValues) => {
    updateProfile.mutate({
      name: data.name,
      username: data.username,
      bio: data.bio || null,
      avatar_url: data.avatar_url || null,
    });
  };

  const handleAvatarUpload = (url: string) => {
    setValue("avatar_url", url, { shouldDirty: true });
  };

  const handleBecomeCreator = async () => {
    // Check if profile is complete first
    const currentName = watch("name");
    const currentUsername = watch("username");

    if (!currentName || !currentUsername) {
      toast.error("Complete seu perfil (nome e username) antes de se tornar um Creator");
      return;
    }

    setIsSwitchingRole(true);
    const { error } = await switchRole("creator");
    setIsSwitchingRole(false);

    if (!error) {
      navigate("/creator/shop");
    }
  };

  if (loading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const isCreator = hasRole("creator");

  return (
    <UserLayout title="Meu Perfil" description="Gerencie suas informações e configurações">
      <div className="space-y-6">
        {/* Error Alert */}
        {errorMessage && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{decodeURIComponent(errorMessage)}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Profile Info */}
          <Card>
            <CardHeader>
              <CardTitle>Informações Básicas</CardTitle>
              <CardDescription>
                Essas informações serão exibidas publicamente no seu perfil
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <AvatarUploadButton
                  currentAvatarUrl={avatarUrl}
                  userName={name || "U"}
                  onUploadComplete={handleAvatarUpload}
                />
                <div className="text-center sm:text-left">
                  <p className="text-sm font-medium">Foto de perfil</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Clique na imagem para alterar
                  </p>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome *</Label>
                  <Input
                    id="name"
                    placeholder="Seu nome"
                    {...register("name")}
                  />
                  {errors.name && (
                    <p className="text-sm text-destructive">{errors.name.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="username">Username *</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      @
                    </span>
                    <Input
                      id="username"
                      placeholder="seuusername"
                      className="pl-9"
                      {...register("username")}
                    />
                  </div>
                  {errors.username && (
                    <p className="text-sm text-destructive">{errors.username.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="bio">Bio</Label>
                  <span className="text-xs text-muted-foreground">{bio.length}/500</span>
                </div>
                <Textarea
                  id="bio"
                  placeholder="Conte um pouco sobre você..."
                  rows={4}
                  maxLength={500}
                  {...register("bio")}
                />
                {errors.bio && (
                  <p className="text-sm text-destructive">{errors.bio.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  value={user?.email || ""}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  O email não pode ser alterado
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button type="submit" disabled={!isDirty || updateProfile.isPending}>
              {updateProfile.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                "Salvar Alterações"
              )}
            </Button>
          </div>
        </form>

        {/* Stats */}
        <UserStats />

        {/* Role Badge */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Status da Conta
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm text-muted-foreground">Seus papéis:</span>
              {userRoles.length > 0 ? (
                userRoles.map((role) => (
                  <Badge 
                    key={role} 
                    variant={role === "creator" ? "default" : "secondary"}
                    className="capitalize"
                  >
                    {role === "creator" ? "Creator" : role === "admin" ? "Admin" : "Follower"}
                  </Badge>
                ))
              ) : (
                <Badge variant="outline">Follower</Badge>
              )}
            </div>

            {/* Become Creator CTA */}
            {!isCreator && (
              <div className="mt-4 p-4 rounded-lg bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <div className="flex-1">
                    <h4 className="font-semibold flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-primary" />
                      Torne-se um Creator
                    </h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      Compartilhe produtos e ganhe com links de afiliado
                    </p>
                  </div>
                  <Button 
                    onClick={handleBecomeCreator}
                    disabled={isSwitchingRole}
                    className="whitespace-nowrap"
                  >
                    {isSwitchingRole ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processando...
                      </>
                    ) : (
                      "Virar Creator"
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* Creator Dashboard Link */}
            {isCreator && (
              <div className="mt-4">
                <Button 
                  variant="outline" 
                  onClick={() => navigate("/creator/shop")}
                  className="gap-2"
                >
                  <Settings className="h-4 w-4" />
                  Ir para Minha Loja
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Security */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              Segurança
            </CardTitle>
            <CardDescription>
              Gerencie a segurança da sua conta
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Alterar senha</p>
                <p className="text-sm text-muted-foreground">
                  Atualize sua senha regularmente para manter sua conta segura
                </p>
              </div>
              <Button variant="outline" onClick={() => setShowPasswordModal(true)}>
                <Key className="h-4 w-4 mr-2" />
                Alterar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="h-5 w-5" />
              Zona de Perigo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Excluir conta</p>
                <p className="text-sm text-muted-foreground">
                  Exclua permanentemente sua conta e todos os dados
                </p>
              </div>
              <Button variant="destructive" onClick={() => setShowDeleteModal(true)}>
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir conta
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <ChangePasswordModal open={showPasswordModal} onOpenChange={setShowPasswordModal} />
      <DeleteAccountModal 
        open={showDeleteModal} 
        onOpenChange={setShowDeleteModal}
        isCreator={isCreator}
      />
    </UserLayout>
  );
}
