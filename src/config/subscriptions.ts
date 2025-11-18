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
    monthlyPrice: 39.99,
    annualPrice: 407.89, // (39.99 * 12 * 0.85) = 15% discount
    annualDiscount: 15,
    description: 'Perfect for small businesses getting started',
    annualBenefits: {
      freeTrialDays: 30,
      freeSetupValue: 149.99,
      discountPercentage: 15,
    },
    features: {
      maxAgents: 5,
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
    },
  },
  ELITE: {
    id: 'ELITE',
    name: 'Elite',
    monthlyPrice: 69.99,
    annualPrice: 713.89, // (69.99 * 12 * 0.85) = 15% discount
    annualDiscount: 15,
    description: 'For growing teams who need more power',
    popular: true,
    annualBenefits: {
      freeTrialDays: 30,
      freeSetupValue: 149.99,
      discountPercentage: 15,
    },
    features: {
      maxAgents: 15,
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
    },
  },
  PRO: {
    id: 'PRO',
    name: 'Professional',
    monthlyPrice: 99.99,
    annualPrice: 1019.89, // (99.99 * 12 * 0.85) = 15% discount
    annualDiscount: 15,
    description: 'Advanced features for professional teams',
    annualBenefits: {
      freeTrialDays: 30,
      freeSetupValue: 149.99,
      discountPercentage: 15,
    },
    features: {
      maxAgents: 50,
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
    },
  },
  ENTERPRISE: {
    id: 'ENTERPRISE',
    name: 'Enterprise',
    monthlyPrice: 299.99,
    annualPrice: 3059.89, // (299.99 * 12 * 0.85) = 15% discount
    annualDiscount: 15,
    description: 'Unlimited power for large organizations',
    annualBenefits: {
      freeTrialDays: 30,
      freeSetupValue: 149.99,
      discountPercentage: 15,
    },
    features: {
      maxAgents: 999,
      maxSubAdmins: 50,
      maxCustomers: 999999,
      maxCampaigns: 999,
      maxEmailsPerMonth: 999999,
      maxSMSPerMonth: 999999,
      maxVoiceMinutesPerMonth: 99999,
      socialMediaPosts: true,
      aiContentGeneration: true,
      advancedAnalytics: true,
      customBranding: true,
      apiAccess: true,
      prioritySupport: true,
      dedicatedAccountManager: true,
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
