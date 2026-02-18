import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscriptionStatus } from './useSubscriptionStatus';
import { toast } from 'sonner';

/**
 * Guard hook for creator dashboard pages.
 * Redirects:
 *  - Unauthenticated users → /auth/signin
 *  - Users without creator role → /me/feed (with toast)
 *  - Creators with suspended subscription → /reactivate
 *  - Creators with no subscription → /onboarding
 */
export function useCreatorAccess() {
  const { user, hasRole, isLoading: authLoading } = useAuth();
  const { isActive, isSuspended, loading: subLoading } = useSubscriptionStatus();
  const navigate = useNavigate();

  const loading = authLoading || subLoading;

  useEffect(() => {
    if (loading) return;

    if (!user) {
      navigate('/auth/signin', { replace: true });
      return;
    }

    if (!hasRole('creator')) {
      toast.info('Essa área é exclusiva para Creators.');
      navigate('/me/feed', { replace: true });
      return;
    }

    if (isSuspended) {
      navigate('/reactivate', { replace: true });
      return;
    }

    if (!isActive) {
      navigate('/onboarding', { replace: true });
      return;
    }
  }, [loading, user, hasRole, isActive, isSuspended, navigate]);

  return { loading };
}
