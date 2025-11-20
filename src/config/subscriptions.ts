// Subscription Plans Configuration
export type SubscriptionTier = 'STARTER' | 'ELITE' | 'PRO' | 'ENTERPRISE';
export type BillingPeriod = 'monthly' | 'annual';

export interface SubscriptionPlan {
  id: SubscriptionTier;
  name: string;
  monthlyPrice: number;
  annualPrice: number;
  annualDiscount: number; // Percentage saved on annual
  features: {
    maxAgents: number;
    maxSubAdmins: number;
    maxCustomers: number;
    maxCampaigns: number;
    maxEmailsPerMonth: number;
    maxSMSPerMonth: number;
    maxVoiceMinutesPerMonth: number;
    socialMediaPosts: boolean;
    aiContentGeneration: boolean;
    advancedAnalytics: boolean;
    customBranding: boolean;
    apiAccess: boolean;
    prioritySupport: boolean;
    dedicatedAccountManager: boolean;
    whiteGloveService: boolean;
    customization: boolean;
    fullBranding: boolean;
  };
  popular?: boolean;
  description: string;
  annualBenefits: {
    freeTrialDays: number;
    freeSetupValue: number;
    discountPercentage: number;
  };
}

export const SUBSCRIPTION_PLANS: Record<SubscriptionTier, SubscriptionPlan> = {
  STARTER: {
    id: 'STARTER',
    name: 'Starter',
    monthlyPrice: 49.99,
    annualPrice: 509.89, // (49.99 * 12 * 0.85) = 15% discount
    annualDiscount: 15,
    description: 'Perfect for small businesses getting started',
    annualBenefits: {
      freeTrialDays: 30,
      freeSetupValue: 149.99,
      discountPercentage: 15,
    },
    features: {
      maxAgents: 1,
      maxSubAdmins: 1,
      maxCustomers: 500,
      maxCampaigns: 10,
      maxEmailsPerMonth: 5000,
      maxSMSPerMonth: 1000,
      maxVoiceMinutesPerMonth: 100,
      socialMediaPosts: true,
      aiContentGeneration: false,
      advancedAnalytics: false,
      customBranding: false,
      apiAccess: false,
      prioritySupport: false,
      dedicatedAccountManager: false,
      whiteGloveService: false,
      customization: false,
      fullBranding: false,
    },
  },
  ELITE: {
    id: 'ELITE',
    name: 'Elite',
    monthlyPrice: 79.99,
    annualPrice: 815.89, // (79.99 * 12 * 0.85) = 15% discount
    annualDiscount: 15,
    description: 'For growing teams who need more power',
    popular: true,
    annualBenefits: {
      freeTrialDays: 30,
      freeSetupValue: 149.99,
      discountPercentage: 15,
    },
    features: {
      maxAgents: 3,
      maxSubAdmins: 3,
      maxCustomers: 2000,
      maxCampaigns: 25,
      maxEmailsPerMonth: 15000,
      maxSMSPerMonth: 5000,
      maxVoiceMinutesPerMonth: 500,
      socialMediaPosts: true,
      aiContentGeneration: true,
      advancedAnalytics: true,
      customBranding: false,
      apiAccess: true,
      prioritySupport: false,
      dedicatedAccountManager: false,
      whiteGloveService: false,
      customization: false,
      fullBranding: false,
    },
  },
  PRO: {
    id: 'PRO',
    name: 'Professional',
    monthlyPrice: 129.99,
    annualPrice: 1325.89, // (129.99 * 12 * 0.85) = 15% discount
    annualDiscount: 15,
    description: 'Advanced features for professional teams',
    annualBenefits: {
      freeTrialDays: 30,
      freeSetupValue: 149.99,
      discountPercentage: 15,
    },
    features: {
      maxAgents: 5,
      maxSubAdmins: 10,
      maxCustomers: 10000,
      maxCampaigns: 100,
      maxEmailsPerMonth: 50000,
      maxSMSPerMonth: 20000,
      maxVoiceMinutesPerMonth: 2000,
      socialMediaPosts: true,
      aiContentGeneration: true,
      advancedAnalytics: true,
      customBranding: true,
      apiAccess: true,
      prioritySupport: true,
      dedicatedAccountManager: false,
      whiteGloveService: false,
      customization: false,
      fullBranding: false,
    },
  },
  ENTERPRISE: {
    id: 'ENTERPRISE',
    name: 'Enterprise',
    monthlyPrice: 499.99,
    annualPrice: 5099.89, // (499.99 * 12 * 0.85) = 15% discount
    annualDiscount: 15,
    description: 'Unlimited power for large organizations',
    annualBenefits: {
      freeTrialDays: 30,
      freeSetupValue: 149.99,
      discountPercentage: 15,
    },
    features: {
      maxAgents: 15,
      maxSubAdmins: 50,
      maxCustomers: 999999999, // Unlimited (use 999M instead of MAX_SAFE_INTEGER for DB compatibility)
      maxCampaigns: 999999999, // Unlimited
      maxEmailsPerMonth: 999999999, // Unlimited
      maxSMSPerMonth: 999999999, // Unlimited
      maxVoiceMinutesPerMonth: 999999999, // Unlimited
      socialMediaPosts: true,
      aiContentGeneration: true,
      advancedAnalytics: true,
      customBranding: true,
      apiAccess: true,
      prioritySupport: true,
      dedicatedAccountManager: true,
      whiteGloveService: true,
      customization: true,
      fullBranding: true,
    },
  },
};

// Helper function to get plan by ID
export function getSubscriptionPlan(tier: SubscriptionTier): SubscriptionPlan {
  return SUBSCRIPTION_PLANS[tier];
}

// Helper function to check if a plan exists
export function isValidSubscriptionTier(tier: string): tier is SubscriptionTier {
  return tier in SUBSCRIPTION_PLANS;
}

// Stripe Price ID Mapping
// Note: Environment variables must be referenced directly for Next.js to include them at build time
export const STRIPE_PRICE_IDS: Record<SubscriptionTier, { monthly: string | undefined; annual: string | undefined }> = {
  STARTER: {
    monthly: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_STARTER_MONTHLY,
    annual: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_STARTER_ANNUAL,
  },
  ELITE: {
    monthly: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_ELITE_MONTHLY,
    annual: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_ELITE_ANNUAL,
  },
  PRO: {
    monthly: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PRO_MONTHLY,
    annual: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PRO_ANNUAL,
  },
  ENTERPRISE: {
    monthly: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_ENTERPRISE_MONTHLY,
    annual: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_ENTERPRISE_ANNUAL,
  },
};

// Helper function to get Stripe price ID
export function getStripePriceId(tier: SubscriptionTier, period: BillingPeriod): string | undefined {
  return STRIPE_PRICE_IDS[tier]?.[period];
}
