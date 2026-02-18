import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

type SubscriptionStatus = 'trialing' | 'active' | 'past_due' | 'canceled' | 'incomplete' | null;
type Plan = 'monthly' | 'annual' | null;

export interface SubscriptionStatusResult {
  status: SubscriptionStatus;
  plan: Plan;
  trialEnd: Date | null;
  periodEnd: Date | null;
  /** true when status is 'active' or 'trialing' */
  isActive: boolean;
  /** true when status is 'past_due' or 'canceled' (had sub, now suspended) */
  isSuspended: boolean;
  loading: boolean;
}

export function useSubscriptionStatus(): SubscriptionStatusResult {
  const { user } = useAuth();
  const [result, setResult] = useState<SubscriptionStatusResult>({
    status: null,
    plan: null,
    trialEnd: null,
    periodEnd: null,
    isActive: false,
    isSuspended: false,
    loading: true,
  });

  useEffect(() => {
    if (!user?.id) {
      setResult(prev => ({ ...prev, loading: false }));
      return;
    }

    const fetchSub = async () => {
      const { data } = await supabase
        .from('subscriptions')
        .select('status, plan, trial_end, current_period_end')
        .eq('user_id', user.id)
        .maybeSingle();

      const status = (data?.status ?? null) as SubscriptionStatus;
      setResult({
        status,
        plan: (data?.plan ?? null) as Plan,
        trialEnd: data?.trial_end ? new Date(data.trial_end) : null,
        periodEnd: data?.current_period_end ? new Date(data.current_period_end) : null,
        isActive: status === 'active' || status === 'trialing',
        isSuspended: status === 'past_due' || status === 'canceled',
        loading: false,
      });
    };

    fetchSub();

    // Realtime: re-fetch when subscription row changes
    const channel = supabase
      .channel(`sub-status-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'subscriptions',
          filter: `user_id=eq.${user.id}`,
        },
        fetchSub
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  return result;
}
