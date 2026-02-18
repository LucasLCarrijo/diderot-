import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { PLANS } from '@/lib/stripe-config';

export type Feature = 
  | 'creator_pro' 
  | 'unlimited_products' 
  | 'unlimited_collections' 
  | 'analytics' 
  | 'verified_badge';

export function useEntitlements() {
  const { user } = useAuth();

  const { data: entitlements, isLoading, refetch } = useQuery({
    queryKey: ['entitlements', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('entitlements')
        .select('*')
        .eq('user_id', user.id)
        .eq('active', true);

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60, // 1 minute
  });

  const hasFeature = (feature: Feature): boolean => {
    if (!entitlements) return false;
    
    const entitlement = entitlements.find(e => e.feature === feature);
    if (!entitlement || !entitlement.active) return false;

    // Check expiration
    if (entitlement.expires_at) {
      const expiresAt = new Date(entitlement.expires_at);
      if (expiresAt < new Date()) return false;
    }

    return true;
  };

  const hasCreatorPro = hasFeature('creator_pro');

  const getLimits = () => {
    return PLANS.CREATOR_PRO_MONTHLY.features;
  };

  return {
    entitlements,
    isLoading,
    hasFeature,
    hasCreatorPro,
    getLimits,
    refetch,
  };
}
