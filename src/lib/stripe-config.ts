// Stripe Price IDs
export const STRIPE_PRICES = {
  CREATOR_PRO_MONTHLY: 'price_1SfM5cKjrStn4RhpDmL1KYxa',
  CREATOR_PRO_YEARLY: 'price_1Sj20nKjrStn4RhptVBDGbQV',
} as const;

// Plan definitions
export const PLANS = {
  FREE: {
    id: 'free',
    name: 'Free',
    price: 0,
    interval: null,
    features: {
      maxProducts: 15,
      maxCollections: 3,
      maxPostsPerDay: 10,
      analytics: false,
      verifiedBadge: false,
      prioritySupport: false,
    },
    featureList: [
      'Até 15 produtos',
      'Até 3 coleções',
      '10 posts por dia',
      'Links de afiliado',
    ],
  },
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
    name: 'Creator Pro',
    price: 499.00,
    interval: 'year' as const,
    stripePriceId: STRIPE_PRICES.CREATOR_PRO_YEARLY,
    savings: 'Economize 17%',
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
      '2 meses grátis',
      'Acesso antecipado a features',
    ],
  },
} as const;

export type PlanId = keyof typeof PLANS;
