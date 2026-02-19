import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Rss,
  Heart,
  User,
  Settings,
  Sparkles,
  Store,
  LogOut,
  Package,
  FolderOpen,
  Image,
  Users,
  BarChart3,
  ChevronDown,
  ExternalLink,
  CreditCard,
} from "lucide-react";
import { SheetClose } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { UpgradePlanCard } from "./UpgradePlanCard";
import { useEntitlements } from "@/hooks/useEntitlements";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import logoDark from "@/assets/logo-diderot.svg";
import { useMyProfile } from "@/hooks/useProfile";
import { getCreatorProfilePath } from "@/lib/username";

interface AppDrawerMenuProps {
  user: any;
  isLoading: boolean;
  isCreator: boolean;
  onSignOut: () => void;
}

const NAV_LINKS = [
  { name: "Feed", href: "/me/feed", icon: Rss },
  { name: "Wishlist", href: "/me/wishlists", icon: Heart },
];

const CREATOR_NAV = [
  { name: "Meus Produtos", href: "/creator/shop", icon: Package },
  { name: "Coleções", href: "/creator/collections", icon: FolderOpen },
  { name: "Posts", href: "/creator/posts", icon: Image },
  { name: "Audiência", href: "/creator/audience", icon: Users },
  { name: "Analytics", href: "/creator/analytics", icon: BarChart3 },
  { name: "Configurações", href: "/creator/settings", icon: Settings },
  { name: "Faturamento", href: "/creator/billing", icon: CreditCard },
];

export function AppDrawerMenu({
  user,
  isLoading,
  isCreator,
  onSignOut,
}: AppDrawerMenuProps) {
  const location = useLocation();
  const { hasCreatorPro } = useEntitlements();
  const { data: myProfile } = useMyProfile();

  // Auto-expand if on a creator route
  const isOnCreatorRoute = location.pathname.startsWith("/creator");
  const [isCreatorMenuOpen, setIsCreatorMenuOpen] = useState(isOnCreatorRoute);

  // Mostrar card apenas para creators que ainda não têm o plano pro
  const showUpgradeCard = isCreator && !hasCreatorPro && user;

  return (
    <div className="flex flex-col h-full">
      {/* Brand */}
      <div className="px-6 pt-6 pb-4 border-b border-border">
        <Link to="/" className="flex items-center">
          <img src={logoDark} alt="Diderot" className="h-6 w-auto" />
        </Link>
      </div>

      {/* Menu Section */}
      <div className="flex-1 overflow-y-auto px-3 py-4">
        <div className="mb-6">
          <p className="px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
            Menu
          </p>
          <div className="space-y-1">
            {NAV_LINKS.map((link) => {
              const isActive = location.pathname === link.href;
              const Icon = link.icon;
              return (
                <SheetClose asChild key={link.name}>
                  <Link
                    to={link.href}
                    className={cn(
                      "flex items-center gap-3 py-2.5 px-3 rounded-lg transition-colors",
                      isActive
                        ? "bg-muted text-foreground font-medium"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{link.name}</span>
                  </Link>
                </SheetClose>
              );
            })}
          </div>
        </div>

        {/* Account Section */}
        {!isLoading && user && (
          <div className="mb-6">
            <p className="px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
              Minha Conta
            </p>
            <div className="space-y-1">
              <SheetClose asChild>
                <Link
                  to="/me/profile"
                  className={cn(
                    "flex items-center gap-3 py-2.5 px-3 rounded-lg transition-colors",
                    location.pathname === "/me/profile"
                      ? "bg-muted text-foreground font-medium"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <User className="h-5 w-5" />
                  <span>Minha conta</span>
                </Link>
              </SheetClose>
              <SheetClose asChild>
                <Link
                  to="/me/wishlists"
                  className={cn(
                    "flex items-center gap-3 py-2.5 px-3 rounded-lg transition-colors",
                    location.pathname === "/me/wishlists"
                      ? "bg-muted text-foreground font-medium"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <Heart className="h-5 w-5" />
                  <span>Favoritos</span>
                </Link>
              </SheetClose>
              <SheetClose asChild>
                <Link
                  to="/me/settings"
                  className={cn(
                    "flex items-center gap-3 py-2.5 px-3 rounded-lg transition-colors",
                    location.pathname === "/me/settings"
                      ? "bg-muted text-foreground font-medium"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <Settings className="h-5 w-5" />
                  <span>Configurações</span>
                </Link>
              </SheetClose>
              {!isCreator ? (
                <SheetClose asChild>
                  <Link
                    to="/onboarding"
                    className="flex items-center gap-3 py-2.5 px-3 rounded-lg transition-colors text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    <Sparkles className="h-5 w-5" />
                    <span>Aplicar para creator</span>
                  </Link>
                </SheetClose>
              ) : (
                <Collapsible
                  open={isCreatorMenuOpen}
                  onOpenChange={setIsCreatorMenuOpen}
                >
                  <CollapsibleTrigger
                    className={cn(
                      "flex items-center justify-between w-full py-2.5 px-3 rounded-lg transition-colors",
                      isOnCreatorRoute
                        ? "bg-muted text-foreground font-medium"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Store className="h-5 w-5" />
                      <span>Minha Loja</span>
                    </div>
                    <ChevronDown
                      className={cn(
                        "h-4 w-4 transition-transform duration-200",
                        isCreatorMenuOpen && "rotate-180"
                      )}
                    />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
                    <div className="pl-4 mt-1 space-y-1">
                      {/* Link dinâmico para perfil público do creator */}
                      {myProfile?.username && (
                        <SheetClose asChild>
                          <Link
                            to={getCreatorProfilePath(myProfile.username)}
                            className={cn(
                              "flex items-center gap-3 py-2 px-3 rounded-lg transition-colors text-sm",
                              location.pathname === getCreatorProfilePath(myProfile.username)
                                ? "bg-primary/10 text-primary font-medium"
                                : "text-muted-foreground hover:bg-muted hover:text-foreground"
                            )}
                          >
                            <ExternalLink className="h-4 w-4" />
                            <span>Ver minha loja</span>
                          </Link>
                        </SheetClose>
                      )}
                      {CREATOR_NAV.map((item) => {
                        const isActive = location.pathname === item.href;
                        const Icon = item.icon;
                        return (
                          <SheetClose asChild key={item.name}>
                            <Link
                              to={item.href}
                              className={cn(
                                "flex items-center gap-3 py-2 px-3 rounded-lg transition-colors text-sm",
                                isActive
                                  ? "bg-primary/10 text-primary font-medium"
                                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
                              )}
                            >
                              <Icon className="h-4 w-4" />
                              <span>{item.name}</span>
                            </Link>
                          </SheetClose>
                        );
                      })}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              )}
            </div>
          </div>
        )}

        {/* Upgrade Card */}
        {showUpgradeCard && (
          <div className="mb-6 px-3">
            <UpgradePlanCard />
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-border px-3 py-4">
        {!isLoading && user ? (
          <SheetClose asChild>
            <Button
              variant="ghost"
              className="w-full justify-start text-muted-foreground hover:text-foreground hover:bg-muted"
              onClick={onSignOut}
            >
              <LogOut className="h-5 w-5 mr-3" />
              <span>Sair</span>
            </Button>
          </SheetClose>
        ) : (
          <div className="space-y-2">
            <SheetClose asChild>
              <Link
                to="/auth/signin"
                className="flex items-center gap-3 py-2.5 px-3 rounded-lg transition-colors text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <span>Entrar</span>
              </Link>
            </SheetClose>
            <SheetClose asChild>
              <Button
                className="w-full bg-[#111111] text-white hover:bg-[#333333]"
                asChild
              >
                <Link to="/auth/signup">Criar conta</Link>
              </Button>
            </SheetClose>
          </div>
        )}
      </div>
    </div>
  );
}
