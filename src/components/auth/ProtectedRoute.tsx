import { Navigate, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscriptionStatus } from "@/hooks/useSubscriptionStatus";
import { toast } from "sonner";

type AppRole = "admin" | "creator" | "follower";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: AppRole;
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, isLoading, hasRole } = useAuth();
  const location = useLocation();

  // Subscription check is only needed for creator-gated routes
  const needsSubCheck = requiredRole === "creator";
  const { isActive, isSuspended, loading: subLoading } = useSubscriptionStatus();

  const isFollowerAccessingCreator =
    needsSubCheck && !isLoading && !!user && !hasRole("creator");

  useEffect(() => {
    if (isFollowerAccessingCreator) {
      toast.info("Essa área é exclusiva para Creators.");
    }
  }, [isFollowerAccessingCreator]);

  // Wait for auth (and subscription if needed) to resolve
  if (isLoading || (needsSubCheck && subLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground" />
      </div>
    );
  }

  // Not authenticated → sign in
  if (!user) {
    return <Navigate to="/auth/signin" state={{ from: location }} replace />;
  }

  if (needsSubCheck) {
    // No creator role → redirect follower/uncategorised to feed
    if (!hasRole("creator")) {
      return <Navigate to="/me/feed" replace />;
    }
    // Suspended subscription → reactivate page
    if (isSuspended) {
      return <Navigate to="/reactivate" replace />;
    }
    // No active subscription yet → onboarding
    if (!isActive) {
      return <Navigate to="/onboarding" replace />;
    }
  } else if (requiredRole && !hasRole(requiredRole)) {
    // Generic role guard (e.g., admin)
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
