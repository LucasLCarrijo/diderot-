import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { PLANS } from '@/lib/stripe-config';

interface SubscriptionState {
  subscribed: boolean;
  subscriptionTier: string | null;
  subscriptionEnd: string | null;
  status: string | null;
  cancelAtPeriodEnd: boolean;
  isLoading: boolean;
  error: string | null;
}

export function useSubscription() {
  const { user, session } = useAuth();
  const [state, setState] = useState<SubscriptionState>({
    subscribed: false,
    subscriptionTier: null,
    subscriptionEnd: null,
    status: null,
    cancelAtPeriodEnd: false,
    isLoading: true,
    error: null,
  });

  const checkSubscription = useCallback(async () => {
    if (!user || !session?.access_token) {
      setState(prev => ({ ...prev, isLoading: false }));
      return;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const { data, error } = await supabase.functions.invoke('check-subscription', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      setState({
        subscribed: data.subscribed ?? false,
        subscriptionTier: data.subscription_tier ?? null,
        subscriptionEnd: data.subscription_end ?? null,
        status: data.status ?? null,
        cancelAtPeriodEnd: data.cancel_at_period_end ?? false,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      console.error('Error checking subscription:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to check subscription',
      }));
    }
  }, [user, session?.access_token]);

  useEffect(() => {
    checkSubscription();
  }, [checkSubscription]);

  // Periodic refresh every 60 seconds
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(checkSubscription, 60000);
    return () => clearInterval(interval);
  }, [user, checkSubscription]);

  const isCreatorPro = state.subscribed && state.subscriptionTier === 'creator_pro';

  const getPlanLimits = () => {
    if (isCreatorPro) {
      return PLANS.CREATOR_PRO_MONTHLY.features;
    }
    return PLANS.FREE.features;
  };

  return {
    ...state,
    isCreatorPro,
    getPlanLimits,
    refreshSubscription: checkSubscription,
  };
}
