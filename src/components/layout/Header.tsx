import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { UserMenu } from "./UserMenu";
import { SearchBar } from "./SearchBar";
import { Button } from "@/components/ui/button";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import logoDark from "@/assets/logo-diderot.svg";
import logoLight from "@/assets/logo-diderot-white.svg";
import { useTheme } from "next-themes";

export function Header() {
  const { user, isLoading } = useAuth();
  const { resolvedTheme } = useTheme();
  
  const logoSrc = resolvedTheme === "dark" ? logoLight : logoDark;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2 flex-shrink-0">
          <img src={logoSrc} alt="Diderot" className="h-6 w-auto" />
        </Link>

        <div className="hidden md:block flex-1 max-w-md mx-4">
          <SearchBar />
        </div>

        <div className="flex items-center gap-2">
          {isLoading ? (
            <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
          ) : user ? (
            <>
              <NotificationBell />
              <UserMenu />
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="ghost" asChild>
                <Link to="/auth/signin">Entrar</Link>
              </Button>
              <Button asChild>
                <Link to="/auth/signup">Criar conta</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
