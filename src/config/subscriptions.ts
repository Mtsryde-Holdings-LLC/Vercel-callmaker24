// Subscription Plans Configuration
export type SubscriptionTier = 'STARTER' | 'ELITE' | 'PRO' | 'ENTERPRISE';
export type BillingPeriod = 'monthly' | 'annual';

export interface SubscriptionPlan {
  id: SubscriptionTier;
  name: string;
  monthlyPrice: number;
  annualPrice: number;
  annualDiscount: number;
  features: {
    maxAgents: number;
    maxSubAdmins: number;
    maxCustomers: number;
    maxCampaigns: number;
    maxEmailsPerMonth: number;
    maxSMSPerMonth: number;
    maxVoiceMinutesPerMonth: number;
    maxIVRCampaigns: number;
    maxSocialAccounts: number;
    maxSocialPosts: number;
    emailMarketing: boolean;
    smsMarketing: boolean;
    socialMediaManagement: boolean;
    aiChatbot: boolean;
    aiContentGeneration: boolean;
    ivrCallCenter: boolean;
    loyaltyProgram: boolean;
    shopifyIntegration: boolean;
    advancedAnalytics: boolean;
    customBranding: boolean;
    apiAccess: boolean;
    webhooks: boolean;
    prioritySupport: boolean;
    dedicatedAccountManager: boolean;
    whiteGloveService: boolean;
  };
  popular?: boolean;
  description: string;
}

export const SUBSCRIPTION_PLANS: Record<SubscriptionTier, SubscriptionPlan> = {
  STARTER: {
    id: 'STARTER',
    name: 'Starter',
    monthlyPrice: 49.99,
    annualPrice: 509.89,
    annualDiscount: 15,
    description: 'Perfect for small businesses getting started',
    features: {
      maxAgents: 1,
      maxSubAdmins: 1,
      maxCustomers: 500,
      maxCampaigns: 10,
      maxEmailsPerMonth: 5000,
      maxSMSPerMonth: 1000,
      maxVoiceMinutesPerMonth: 100,
      maxIVRCampaigns: 5,
      maxSocialAccounts: 2,
      maxSocialPosts: 50,
      emailMarketing: true,
      smsMarketing: true,
      socialMediaManagement: true,
      aiChatbot: false,
      aiContentGeneration: false,
      ivrCallCenter: true,
      loyaltyProgram: false,
      shopifyIntegration: false,
      advancedAnalytics: false,
      customBranding: false,
      apiAccess: false,
      webhooks: false,
      prioritySupport: false,
      dedicatedAccountManager: false,
      whiteGloveService: false,
    },
  },
  ELITE: {
    id: 'ELITE',
    name: 'Elite',
    monthlyPrice: 79.99,
    annualPrice: 815.89,
    annualDiscount: 15,
    description: 'For growing teams who need more power',
    popular: true,
    features: {
      maxAgents: 3,
      maxSubAdmins: 3,
      maxCustomers: 2000,
      maxCampaigns: 25,
      maxEmailsPerMonth: 15000,
      maxSMSPerMonth: 5000,
      maxVoiceMinutesPerMonth: 500,
      maxIVRCampaigns: 15,
      maxSocialAccounts: 5,
      maxSocialPosts: 200,
      emailMarketing: true,
      smsMarketing: true,
      socialMediaManagement: true,
      aiChatbot: true,
      aiContentGeneration: true,
      ivrCallCenter: true,
      loyaltyProgram: true,
      shopifyIntegration: true,
      advancedAnalytics: true,
      customBranding: false,
      apiAccess: true,
      webhooks: true,
      prioritySupport: false,
      dedicatedAccountManager: false,
      whiteGloveService: false,
    },
  },
  PRO: {
    id: 'PRO',
    name: 'Professional',
    monthlyPrice: 129.99,
    annualPrice: 1325.89,
    annualDiscount: 15,
    description: 'Advanced features for professional teams',
    features: {
      maxAgents: 5,
      maxSubAdmins: 10,
      maxCustomers: 10000,
      maxCampaigns: 100,
      maxEmailsPerMonth: 50000,
      maxSMSPerMonth: 20000,
      maxVoiceMinutesPerMonth: 2000,
      maxIVRCampaigns: 50,
      maxSocialAccounts: 10,
      maxSocialPosts: 1000,
      emailMarketing: true,
      smsMarketing: true,
      socialMediaManagement: true,
      aiChatbot: true,
      aiContentGeneration: true,
      ivrCallCenter: true,
      loyaltyProgram: true,
      shopifyIntegration: true,
      advancedAnalytics: true,
      customBranding: true,
      apiAccess: true,
      webhooks: true,
      prioritySupport: true,
      dedicatedAccountManager: false,
      whiteGloveService: false,
    },
  },
  ENTERPRISE: {
    id: 'ENTERPRISE',
    name: 'Enterprise',
    monthlyPrice: 499.99,
    annualPrice: 5099.89,
    annualDiscount: 15,
    description: 'Unlimited power for large organizations',
    features: {
      maxAgents: -1,
      maxSubAdmins: -1,
      maxCustomers: -1,
      maxCampaigns: -1,
      maxEmailsPerMonth: -1,
      maxSMSPerMonth: -1,
      maxVoiceMinutesPerMonth: -1,
      maxIVRCampaigns: -1,
      maxSocialAccounts: -1,
      maxSocialPosts: -1,
      emailMarketing: true,
      smsMarketing: true,
      socialMediaManagement: true,
      aiChatbot: true,
      aiContentGeneration: true,
      ivrCallCenter: true,
      loyaltyProgram: true,
      shopifyIntegration: true,
      advancedAnalytics: true,
      customBranding: true,
      apiAccess: true,
      webhooks: true,
      prioritySupport: true,
      dedicatedAccountManager: true,
      whiteGloveService: true,
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
