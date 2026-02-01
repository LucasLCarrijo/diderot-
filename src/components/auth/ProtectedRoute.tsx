import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

type AppRole = "admin" | "creator" | "follower";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: AppRole;
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, isLoading, hasRole } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth/signin" state={{ from: location }} replace />;
  }

  // Check for required role if specified
  if (requiredRole && !hasRole(requiredRole)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <h1 className="text-2xl font-semibold">Acesso Negado</h1>
        <p className="text-muted-foreground">
          Você não tem permissão para acessar esta página.
        </p>
        <a href="/" className="text-primary underline">
          Voltar ao início
        </a>
      </div>
    );
  }

  return <>{children}</>;
}
