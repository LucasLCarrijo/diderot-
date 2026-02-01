import { Link } from "react-router-dom";
import { LogOut, User, Settings, LayoutDashboard, Heart, Rss, BarChart3, Users, Bell } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

export function UserMenu() {
  const { user, signOut, hasRole } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    toast.success("Logout realizado com sucesso");
  };

  const userInitials = user?.user_metadata?.name
    ? user.user_metadata.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
    : user?.email?.slice(0, 2).toUpperCase() || "U";

  const isCreator = hasRole("creator");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-full">
          <Avatar className="h-8 w-8 cursor-pointer transition-opacity hover:opacity-80">
            <AvatarImage src={user?.user_metadata?.avatar_url} alt="Avatar" />
            <AvatarFallback className="text-xs">{userInitials}</AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            {user?.user_metadata?.name && (
              <p className="font-medium text-sm leading-none">{user.user_metadata.name}</p>
            )}
            <p className="text-xs text-muted-foreground truncate">
              {user?.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <DropdownMenuItem asChild>
          <Link to="/me/feed" className="cursor-pointer">
            <Rss className="mr-2 h-4 w-4" />
            Meu Feed
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/me/wishlists" className="cursor-pointer">
            <Heart className="mr-2 h-4 w-4" />
            Favoritos
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/me/following" className="cursor-pointer">
            <Users className="mr-2 h-4 w-4" />
            Seguindo
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/notifications" className="cursor-pointer">
            <Bell className="mr-2 h-4 w-4" />
            Notificações
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/me/profile" className="cursor-pointer">
            <User className="mr-2 h-4 w-4" />
            Meu Perfil
          </Link>
        </DropdownMenuItem>
        
        {isCreator && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Creator
            </DropdownMenuLabel>
            <DropdownMenuItem asChild>
              <Link to="/creator/shop" className="cursor-pointer">
                <LayoutDashboard className="mr-2 h-4 w-4" />
                Minha Loja
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/creator/audience" className="cursor-pointer">
                <Users className="mr-2 h-4 w-4" />
                Meus Seguidores
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/creator/analytics" className="cursor-pointer">
                <BarChart3 className="mr-2 h-4 w-4" />
                Analytics
              </Link>
            </DropdownMenuItem>
          </>
        )}
        
        {!isCreator && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/creator/shop" className="cursor-pointer">
                <LayoutDashboard className="mr-2 h-4 w-4" />
                Área do Creator
              </Link>
            </DropdownMenuItem>
          </>
        )}
        
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/me/settings" className="cursor-pointer">
            <Settings className="mr-2 h-4 w-4" />
            Configurações
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-destructive focus:text-destructive">
          <LogOut className="mr-2 h-4 w-4" />
          Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
