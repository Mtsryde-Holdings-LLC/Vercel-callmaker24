import { UserRole } from '@prisma/client'

// Define permissions for each role
export const ROLE_PERMISSIONS = {
  SUPER_ADMIN: {
    // Full system access
    canManageAllUsers: true,
    canManageAllOrganizations: true,
    canAccessAllData: true,
    canManageSubscriptions: true,
    canManageSystemSettings: true,
    canViewAnalytics: true,
    canManageRoles: true,
  },
  CORPORATE_ADMIN: {
    // Organization-level access with subscription limits
    canManageOwnOrganization: true,
    canManageSubAdmins: true,
    canManageAgents: true,
    canManageCustomers: true,
    canViewOrganizationAnalytics: true,
    canManageCampaigns: true,
    canManageIntegrations: true,
    canManageSubscription: true,
  },
  SUB_ADMIN: {
    // Limited admin access - customizable by Corporate Admin
    canManageAgents: false, // Default, can be overridden
    canManageCustomers: true,
    canViewAnalytics: true,
    canManageCampaigns: true,
    canManageIntegrations: false,
  },
  AGENT: {
    // Customer service level access
    canViewCustomers: true,
    canManageOwnCalls: true,
    canViewOwnAnalytics: true,
  },
  SUBSCRIBER: {
    // Basic user access
    canViewOwnData: true,
  },
}

// Subscription plan limits
export const SUBSCRIPTION_LIMITS = {
  FREE: {
    maxSubAdmins: 0,
    maxAgents: 1,
    maxCustomers: 100,
    emailCredits: 100,
    smsCredits: 50,
  },
  BASIC: {
    maxSubAdmins: 1,
    maxAgents: 5,
    maxCustomers: 1000,
    emailCredits: 1000,
    smsCredits: 500,
  },
  PRO: {
    maxSubAdmins: 5,
    maxAgents: 20,
    maxCustomers: 10000,
    emailCredits: 10000,
    smsCredits: 5000,
  },
  ENTERPRISE: {
    maxSubAdmins: -1, // Unlimited
    maxAgents: -1,
    maxCustomers: -1,
    emailCredits: -1,
    smsCredits: -1,
  },
}

// Check if user has permission
export function hasPermission(
  role: UserRole,
  permission: string,
  customPermissions?: any
): boolean {
  // Super admin has all permissions
  if (role === 'SUPER_ADMIN') return true

  // For sub-admins, check custom permissions first
  if (role === 'SUB_ADMIN' && customPermissions) {
    if (permission in customPermissions) {
      return customPermissions[permission]
    }
  }

  // Check role-based permissions
  const rolePermissions = ROLE_PERMISSIONS[role] || {}
  return rolePermissions[permission as keyof typeof rolePermissions] || false
}

// Check if organization can add more users of a specific role
export function canAddUser(
  currentCount: number,
  maxAllowed: number,
  role: UserRole
): { allowed: boolean; reason?: string } {
  // Unlimited
  if (maxAllowed === -1) return { allowed: true }

  if (currentCount >= maxAllowed) {
    return {
      allowed: false,
      reason: `Maximum ${role.toLowerCase()}s limit reached. Upgrade your subscription to add more.`,
    }
  }

  return { allowed: true }
}

// Get permissions display for sub-admin assignment
export const SUB_ADMIN_ASSIGNABLE_PERMISSIONS = [
  { key: 'canManageAgents', label: 'Manage Agents', description: 'Add, edit, and remove agents' },
  { key: 'canManageCustomers', label: 'Manage Customers', description: 'Full customer management access' },
  { key: 'canViewAnalytics', label: 'View Analytics', description: 'Access analytics and reports' },
  { key: 'canManageCampaigns', label: 'Manage Campaigns', description: 'Create and manage email/SMS campaigns' },
  { key: 'canManageIntegrations', label: 'Manage Integrations', description: 'Connect and manage integrations' },
  { key: 'canManageCallCenter', label: 'Manage Call Center', description: 'Access call center features' },
  { key: 'canManageSocial', label: 'Manage Social Media', description: 'Manage social media posts and accounts' },
]
