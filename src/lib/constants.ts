// ============================================================
// Centralized App Constants
// All brand info, pricing, contact details, and policies
// Update values here — they propagate across the entire app.
// ============================================================

// ---- Brand ----
export const APP_NAME = "CallMaker24";
export const APP_DOMAIN =
  process.env.NEXT_PUBLIC_APP_URL ||
  process.env.NEXTAUTH_URL ||
  "https://callmaker24.com";
export const APP_LOGO = "/images/logo.png";
export const APP_COPYRIGHT_YEAR = new Date().getFullYear();

// ---- Contact ----
export const SUPPORT_PHONE = "+16125408684";
export const SUPPORT_PHONE_DISPLAY = "612-540-8684";
export const SUPPORT_EMAIL = "support@callmaker24.com";
export const PRIVACY_EMAIL = "privacy@callmaker24.com";
export const NOREPLY_EMAIL =
  process.env.AWS_SES_FROM_EMAIL || "noreply@callmaker24.com";
export const REWARDS_EMAIL =
  process.env.EMAIL_FROM || "rewards@callmaker24.com";

// ---- Pricing ----
export const PRICING = {
  STARTER: {
    name: "Starter",
    monthly: 49.99,
    annual: 509.9, // ~$42.49/mo → 15 % off
    annualMonthly: 42.49,
    setupFee: 0,
  },
  PRO: {
    name: "Professional",
    monthly: 69.99,
    annual: 713.9, // ~$59.49/mo → 15 % off
    annualMonthly: 59.49,
    setupFee: 0,
  },
  ENTERPRISE: {
    name: "Enterprise",
    monthly: 129.99,
    annual: 1325.9, // ~$110.49/mo → 15 % off
    annualMonthly: 110.49,
    setupFee: 0,
  },
} as const;

// ---- Policies ----
export const RETURN_WINDOW_DAYS = 30;
export const REFUND_PROCESSING_DAYS = "5-10";

// ---- Loyalty Tier Benefits (for emails / prompts) ----
export const TIER_BENEFITS: Record<string, string[]> = {
  BRONZE: ["1 point per $1 spent"],
  SILVER: [
    "1.5 points per $1 spent",
    "10% tier discount",
    "Early access to sales",
  ],
  GOLD: [
    "2 points per $1 spent",
    "15% tier discount",
    "Free shipping",
    "Priority support",
  ],
  DIAMOND: [
    "3 points per $1 spent",
    "15% + $10 off tier discount",
    "Free shipping",
    "Priority support",
    "Exclusive access to new products",
  ],
};
