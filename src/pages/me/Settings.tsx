import { useState } from "react";
import { UserLayout } from "@/components/layout/UserLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ChangePasswordModal } from "@/components/me/ChangePasswordModal";
import { DeleteAccountModal } from "@/components/me/DeleteAccountModal";
import {
  Bell,
  Mail,
  Shield,
  Trash2,
  Key,
  Download,
  Globe,
  Lock,
} from "lucide-react";
import { toast } from "sonner";

export default function Settings() {
  const { user, hasRole } = useAuth();
  const { loading } = useRequireAuth();
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Notification preferences state
  const [emailNotifications, setEmailNotifications] = useState({
    followers: true,
    favorites: true,
    clicks: true,
    newsletter: false,
    monthlyDigest: true,
  });

  const [inAppNotifications, setInAppNotifications] = useState({
    all: true,
    followers: true,
    favorites: true,
    clicks: true,
  });

  const [privacySettings, setPrivacySettings] = useState({
    publicProfile: true,
    allowIndexing: true,
    showStats: true,
    allowBrandMessages: true,
  });

  const isCreator = hasRole("creator");

  const handleExportData = async () => {
    toast.info("Estamos preparando seus dados. Você receberá um email quando estiver pronto.");
    // In a real app, this would trigger a backend job
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <UserLayout title="Configurações" description="Gerencie suas preferências e privacidade">
      <div className="space-y-6">
        {/* Email Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Notificações por Email
            </CardTitle>
            <CardDescription>
              Escolha quais emails você deseja receber
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="email-followers">Novos seguidores</Label>
                <p className="text-sm text-muted-foreground">
                  Receba quando alguém começar a seguir você
                </p>
              </div>
              <Switch
                id="email-followers"
                checked={emailNotifications.followers}
                onCheckedChange={(checked) =>
                  setEmailNotifications({ ...emailNotifications, followers: checked })
                }
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="email-favorites">Produtos favoritados</Label>
                <p className="text-sm text-muted-foreground">
                  Quando alguém favoritar seus produtos
                </p>
              </div>
              <Switch
                id="email-favorites"
                checked={emailNotifications.favorites}
                onCheckedChange={(checked) =>
                  setEmailNotifications({ ...emailNotifications, favorites: checked })
                }
              />
            </div>
            {isCreator && (
              <>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="email-clicks">Novos cliques</Label>
                    <p className="text-sm text-muted-foreground">
                      Resumo diário de cliques nos seus produtos
                    </p>
                  </div>
                  <Switch
                    id="email-clicks"
                    checked={emailNotifications.clicks}
                    onCheckedChange={(checked) =>
                      setEmailNotifications({ ...emailNotifications, clicks: checked })
                    }
                  />
                </div>
              </>
            )}
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="email-newsletter">Newsletter semanal</Label>
                <p className="text-sm text-muted-foreground">
                  Novidades e dicas do Diderot
                </p>
              </div>
              <Switch
                id="email-newsletter"
                checked={emailNotifications.newsletter}
                onCheckedChange={(checked) =>
                  setEmailNotifications({ ...emailNotifications, newsletter: checked })
                }
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="email-digest">Resumo mensal</Label>
                <p className="text-sm text-muted-foreground">
                  Estatísticas e destaques do mês
                </p>
              </div>
              <Switch
                id="email-digest"
                checked={emailNotifications.monthlyDigest}
                onCheckedChange={(checked) =>
                  setEmailNotifications({ ...emailNotifications, monthlyDigest: checked })
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* In-App Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notificações no App
            </CardTitle>
            <CardDescription>
              Controle as notificações que aparecem na plataforma
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="inapp-all">Todas as notificações</Label>
                <p className="text-sm text-muted-foreground">
                  Ativar/desativar todas de uma vez
                </p>
              </div>
              <Switch
                id="inapp-all"
                checked={inAppNotifications.all}
                onCheckedChange={(checked) =>
                  setInAppNotifications({
                    all: checked,
                    followers: checked,
                    favorites: checked,
                    clicks: checked,
                  })
                }
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="inapp-followers">Seguidores</Label>
              </div>
              <Switch
                id="inapp-followers"
                checked={inAppNotifications.followers}
                onCheckedChange={(checked) =>
                  setInAppNotifications({ ...inAppNotifications, followers: checked })
                }
                disabled={!inAppNotifications.all}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="inapp-favorites">Favoritos</Label>
              </div>
              <Switch
                id="inapp-favorites"
                checked={inAppNotifications.favorites}
                onCheckedChange={(checked) =>
                  setInAppNotifications({ ...inAppNotifications, favorites: checked })
                }
                disabled={!inAppNotifications.all}
              />
            </div>
            {isCreator && (
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="inapp-clicks">Cliques</Label>
                </div>
                <Switch
                  id="inapp-clicks"
                  checked={inAppNotifications.clicks}
                  onCheckedChange={(checked) =>
                    setInAppNotifications({ ...inAppNotifications, clicks: checked })
                  }
                  disabled={!inAppNotifications.all}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Privacy Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Privacidade
            </CardTitle>
            <CardDescription>
              Controle a visibilidade do seu perfil
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="privacy-public">Perfil público</Label>
                <p className="text-sm text-muted-foreground">
                  Seu perfil pode ser visto por qualquer pessoa
                </p>
              </div>
              <Switch
                id="privacy-public"
                checked={privacySettings.publicProfile}
                onCheckedChange={(checked) =>
                  setPrivacySettings({ ...privacySettings, publicProfile: checked })
                }
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="privacy-seo" className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Indexação em buscadores
                </Label>
                <p className="text-sm text-muted-foreground">
                  Seu perfil pode aparecer no Google
                </p>
              </div>
              <Switch
                id="privacy-seo"
                checked={privacySettings.allowIndexing}
                onCheckedChange={(checked) =>
                  setPrivacySettings({ ...privacySettings, allowIndexing: checked })
                }
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="privacy-stats">Mostrar estatísticas</Label>
                <p className="text-sm text-muted-foreground">
                  Exibir contagem de seguidores e favoritos
                </p>
              </div>
              <Switch
                id="privacy-stats"
                checked={privacySettings.showStats}
                onCheckedChange={(checked) =>
                  setPrivacySettings({ ...privacySettings, showStats: checked })
                }
              />
            </div>
            {isCreator && (
              <>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="privacy-brands">Mensagens de marcas</Label>
                    <p className="text-sm text-muted-foreground">
                      Permitir que marcas entrem em contato
                    </p>
                  </div>
                  <Switch
                    id="privacy-brands"
                    checked={privacySettings.allowBrandMessages}
                    onCheckedChange={(checked) =>
                      setPrivacySettings({ ...privacySettings, allowBrandMessages: checked })
                    }
                  />
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Security */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
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
                  Atualize sua senha regularmente
                </p>
              </div>
              <Button variant="outline" onClick={() => setShowPasswordModal(true)}>
                <Key className="h-4 w-4 mr-2" />
                Alterar
              </Button>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Exportar dados (LGPD)</p>
                <p className="text-sm text-muted-foreground">
                  Baixe uma cópia de todos os seus dados
                </p>
              </div>
              <Button variant="outline" onClick={handleExportData}>
                <Download className="h-4 w-4 mr-2" />
                Exportar
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
            <CardDescription>
              Ações irreversíveis na sua conta
            </CardDescription>
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
