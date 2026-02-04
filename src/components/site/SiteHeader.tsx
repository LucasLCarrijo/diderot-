import { Link, useNavigate } from "react-router-dom";
import { Menu } from "lucide-react";

import { useAuth } from "@/contexts/AuthContext";
import logoDark from "@/assets/logo-diderot.svg";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { AppDrawerMenu } from "./AppDrawerMenu";

const NAV_LINKS = [
  { name: "Home", href: "/" },
  { name: "Feed", href: "/me/feed" },
  { name: "Wishlist", href: "/me/wishlists" },
];

export function SiteHeader() {
  const { user, isLoading, signOut, hasRole } = useAuth();
  const navigate = useNavigate();

  const isCreator = hasRole("creator");

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-black/10 bg-white shadow-sm">
      <div className="mx-auto flex h-16 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8 max-w-7xl">
        <Link to="/" className="flex items-center gap-2 flex-shrink-0">
          <img src={logoDark} alt="Diderot" className="h-6 w-auto" width={80} height={24} />
          <span className="sr-only">Diderot</span>
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.name}
              to={link.href}
              className="text-sm font-medium text-[#111111] hover:text-[#525252] transition-colors"
            >
              {link.name}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Abrir menu"
                className="text-[#111111]"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[320px] p-0 bg-white !h-full flex flex-col">
              <AppDrawerMenu
                user={user}
                isLoading={isLoading}
                isCreator={isCreator}
                onSignOut={handleSignOut}
              />
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}

export { NAV_LINKS as SITE_NAV_LINKS };

