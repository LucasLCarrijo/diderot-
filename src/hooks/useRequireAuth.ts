import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

type AppRole = "admin" | "creator" | "follower";

interface UseRequireAuthOptions {
  redirectTo?: string;
  redirectIfNotRole?: string;
}

/**
 * Hook para verificar autenticação e role do usuário
 * Redireciona automaticamente se não autenticado ou sem role necessária
 * 
 * @example
 * function CreatorShopPage() {
 *   const { user, loading } = useRequireAuth('creator');
 *   if (loading) return <Spinner />;
 *   // user está autenticado e é creator
 * }
 */
export function useRequireAuth(
  requiredRole?: AppRole,
  options: UseRequireAuthOptions = {}
) {
  const { user, isLoading, hasRole, userRoles } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const {
    redirectTo = "/auth/signin",
    redirectIfNotRole = "/me",
  } = options;

  useEffect(() => {
    // Aguarda loading terminar
    if (isLoading) return;

    // Se não autenticado, redireciona para login
    if (!user) {
      navigate(redirectTo, { 
        state: { from: location },
        replace: true 
      });
      return;
    }

    // Se role é necessária e usuário não tem, redireciona
    if (requiredRole && !hasRole(requiredRole)) {
      const errorMessage = `Você precisa ser ${requiredRole} para acessar esta página.`;
      navigate(`${redirectIfNotRole}?error=role_required&message=${encodeURIComponent(errorMessage)}`, { 
        replace: true 
      });
    }
  }, [user, isLoading, requiredRole, hasRole, navigate, location, redirectTo, redirectIfNotRole]);

  return {
    user,
    loading: isLoading,
    isAuthenticated: !!user,
    hasRequiredRole: requiredRole ? hasRole(requiredRole) : true,
    userRoles,
  };
}
