// Trial Period Limitations
// Users on free trial have limited access to certain features

export interface TrialLimits {
  // Feature access
  canAccessAIContent: boolean;
  canAccessAdvancedAnalytics: boolean;
  canAccessCustomBranding: boolean;
  canAccessWhiteGlove: boolean;
  canAccessAPI: boolean;
  
  // Usage limits (stricter than subscription limits)
  maxCampaigns: number;
  maxEmailsPerDay: number;
  maxSMSPerDay: number;
  maxCustomers: number;
  
  // Premium features
  canExportData: boolean;
  canScheduleCampaigns: boolean;
  canUseAutomation: boolean;
  canAccessReports: boolean;
}

export const TRIAL_LIMITS: TrialLimits = {
  // Feature access - Most premium features disabled
  canAccessAIContent: false,
  canAccessAdvancedAnalytics: false,
  canAccessCustomBranding: false,
  canAccessWhiteGlove: false,
  canAccessAPI: false,
  
  // Usage limits - Conservative limits
  maxCampaigns: 2,
  maxEmailsPerDay: 50,
  maxSMSPerDay: 20,
  maxCustomers: 25,
  
  // Premium features - Limited
  canExportData: false,
  canScheduleCampaigns: true, // Allow scheduling
  canUseAutomation: false,
  canAccessReports: true, // Basic reports only
}

export const RESTRICTED_FEATURES = [
  {
    name: 'AI Content Generation',
    description: 'Let AI write your marketing content',
    icon: '🤖',
    availableIn: ['ELITE', 'PRO', 'ENTERPRISE'],
  },
  {
    name: 'Advanced Analytics',
    description: 'Deep insights and custom reports',
    icon: '📊',
    availableIn: ['ELITE', 'PRO', 'ENTERPRISE'],
  },
  {
    name: 'Custom Branding',
    description: 'White-label the platform with your brand',
    icon: '🎨',
    availableIn: ['PRO', 'ENTERPRISE'],
  },
  {
    name: 'API Access',
    description: 'Integrate with your own systems',
    icon: '🔌',
    availableIn: ['ELITE', 'PRO', 'ENTERPRISE'],
  },
  {
    name: 'Marketing Automation',
    description: 'Automated workflows and triggers',
    icon: '⚡',
    availableIn: ['ELITE', 'PRO', 'ENTERPRISE'],
  },
  {
    name: 'Data Export',
    description: 'Export all your data anytime',
    icon: '📥',
    availableIn: ['ELITE', 'PRO', 'ENTERPRISE'],
  },
  {
    name: 'Priority Support',
    description: '24/7 priority customer support',
    icon: '🎧',
    availableIn: ['PRO', 'ENTERPRISE'],
  },
  {
    name: 'White Glove Service',
    description: 'Dedicated account manager',
    icon: '🤝',
    availableIn: ['ENTERPRISE'],
  },
]

// Helper function to check if user is on trial
export function isUserOnTrial(subscriptionStatus: string, subscriptionStartDate: Date | null): boolean {
  if (subscriptionStatus !== 'TRIAL') return false
  
  if (!subscriptionStartDate) return false
  
  const trialEndDate = new Date(subscriptionStartDate)
  trialEndDate.setDate(trialEndDate.getDate() + 30)
  
  return new Date() < trialEndDate
}

// Helper function to get days remaining in trial
export function getDaysRemainingInTrial(subscriptionStartDate: Date | null): number {
  if (!subscriptionStartDate) return 0
  
  const trialEndDate = new Date(subscriptionStartDate)
  trialEndDate.setDate(trialEndDate.getDate() + 30)
  
  const now = new Date()
  const daysRemaining = Math.ceil((trialEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  
  return Math.max(0, daysRemaining)
}

// Check if a specific feature is available
export function isFeatureAvailable(
  featureName: string,
  isOnTrial: boolean,
  subscriptionTier?: string
): boolean {
  if (isOnTrial) {
    // During trial, most premium features are locked
    const allowedTrialFeatures = ['canScheduleCampaigns', 'canAccessReports']
    return allowedTrialFeatures.includes(featureName)
  }
  
  // After trial, check subscription tier
  const feature = RESTRICTED_FEATURES.find(f => f.name === featureName)
  if (!feature || !subscriptionTier) return false
  
  return feature.availableIn.includes(subscriptionTier)
}
