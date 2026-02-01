import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useEntitlements } from './useEntitlements';

interface LimitCheckResult {
  allowed: boolean;
  current: number;
  max: number;
  remaining: number;
  percentage: number;
}

export function useCreatorLimits() {
  const { user } = useAuth();
  const { hasCreatorPro, isLoading: entitlementsLoading } = useEntitlements();

  // Get profile ID
  const { data: profile } = useQuery({
    queryKey: ['profile-for-limits', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user?.id,
  });

  // Product count
  const { data: productCount = 0, isLoading: productsLoading } = useQuery({
    queryKey: ['product-count', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return 0;
      const { count } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('creator_id', profile.id)
        .neq('status', 'archived');
      return count || 0;
    },
    enabled: !!profile?.id,
  });

  // Collection count
  const { data: collectionCount = 0, isLoading: collectionsLoading } = useQuery({
    queryKey: ['collection-count', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return 0;
      const { count } = await supabase
        .from('collections')
        .select('*', { count: 'exact', head: true })
        .eq('creator_id', profile.id);
      return count || 0;
    },
    enabled: !!profile?.id,
  });

  // Posts today count
  const { data: postsToday = 0, isLoading: postsLoading } = useQuery({
    queryKey: ['posts-today-count', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return 0;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const { count } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .eq('creator_id', profile.id)
        .gte('created_at', today.toISOString());
      return count || 0;
    },
    enabled: !!profile?.id,
  });

  const FREE_LIMITS = {
    products: 15,
    collections: 3,
    postsPerDay: 10,
  };

  const PRO_LIMITS = {
    products: Infinity,
    collections: Infinity,
    postsPerDay: 50,
  };

  const limits = hasCreatorPro ? PRO_LIMITS : FREE_LIMITS;

  const checkLimit = (type: 'products' | 'collections' | 'postsPerDay'): LimitCheckResult => {
    let current = 0;
    let max = limits[type];

    switch (type) {
      case 'products':
        current = productCount;
        break;
      case 'collections':
        current = collectionCount;
        break;
      case 'postsPerDay':
        current = postsToday;
        break;
    }

    const allowed = max === Infinity || current < max;
    const remaining = max === Infinity ? Infinity : Math.max(0, max - current);
    const percentage = max === Infinity ? 0 : (current / max) * 100;

    return {
      allowed,
      current,
      max,
      remaining,
      percentage,
    };
  };

  return {
    isLoading: entitlementsLoading || productsLoading || collectionsLoading || postsLoading,
    hasCreatorPro,
    limits,
    checkLimit,
    productLimit: checkLimit('products'),
    collectionLimit: checkLimit('collections'),
    postLimit: checkLimit('postsPerDay'),
  };
}
