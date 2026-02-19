// Strip "VAR_NAME=" prefix if someone pasted the full .env line as the value
function cleanPriceId(raw: string | undefined, fallback: string): string {
  const val = raw || fallback;
  const eq = val.indexOf('=');
  return eq !== -1 && !val.startsWith('price_') ? val.slice(eq + 1) : val;
}

// Stripe Price IDs
export const STRIPE_PRICES = {
  CREATOR_PRO_MONTHLY: cleanPriceId(import.meta.env.VITE_STRIPE_MONTHLY_PRICE_ID, 'price_1SfM5cKjrStn4RhpDmL1KYxa'),
  CREATOR_PRO_YEARLY: cleanPriceId(import.meta.env.VITE_STRIPE_ANNUAL_PRICE_ID, 'price_1Sj20nKjrStn4RhptVBDGbQV'),
} as const;

// Plan definitions
export const PLANS = {
  CREATOR_PRO_MONTHLY: {
    id: 'creator_pro_monthly',
    name: 'Creator Pro',
    price: 29.90,
    interval: 'month' as const,
    stripePriceId: STRIPE_PRICES.CREATOR_PRO_MONTHLY,
    features: {
      maxProducts: Infinity,
      maxCollections: Infinity,
      maxPostsPerDay: 50,
      analytics: true,
      verifiedBadge: true,
      prioritySupport: true,
    },
    featureList: [
      'Produtos ilimitados',
      'Coleções ilimitadas',
      '50 posts por dia',
      'Analytics detalhado',
      'Badge verificado',
      'Suporte prioritário',
    ],
  },
  CREATOR_PRO_YEARLY: {
    id: 'creator_pro_yearly',
    name: 'Creator Pro Anual',
    price: 299.90,
    interval: 'year' as const,
    stripePriceId: STRIPE_PRICES.CREATOR_PRO_YEARLY,
    savings: 'Economize 20%',
    features: {
      maxProducts: Infinity,
      maxCollections: Infinity,
      maxPostsPerDay: 50,
      analytics: true,
      verifiedBadge: true,
      prioritySupport: true,
    },
    featureList: [
      'Tudo do plano mensal',
      'Economize R$ 59,00 por ano',
      'Acesso antecipado a features',
    ],
  },
} as const;

export type PlanId = keyof typeof PLANS;

