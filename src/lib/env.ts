/**
 * Environment Variable Validation
 * Validates all required env vars at startup to fail fast on misconfiguration.
 * Import this in layout.tsx or instrumentation.ts so it runs early.
 */

import { z } from "zod";

const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  DIRECT_URL: z.string().optional(),

  // Auth
  NEXTAUTH_URL: z.string().url("NEXTAUTH_URL must be a valid URL").optional(),
  NEXTAUTH_SECRET: z
    .string()
    .min(16, "NEXTAUTH_SECRET must be at least 16 characters"),

  // Stripe
  STRIPE_SECRET_KEY: z
    .string()
    .startsWith("sk_", "STRIPE_SECRET_KEY must start with sk_")
    .optional(),
  STRIPE_WEBHOOK_SECRET: z
    .string()
    .startsWith("whsec_", "STRIPE_WEBHOOK_SECRET must start with whsec_")
    .optional(),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z
    .string()
    .startsWith("pk_", "Publishable key must start with pk_")
    .optional(),

  // Twilio
  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  TWILIO_PHONE_NUMBER: z.string().optional(),

  // Email
  EMAIL_PROVIDER: z.enum(["resend", "mailgun", "sendgrid"]).optional(),
  RESEND_API_KEY: z.string().optional(),
  MAILGUN_API_KEY: z.string().optional(),
  MAILGUN_DOMAIN: z.string().optional(),

  // OpenAI
  OPENAI_API_KEY: z.string().optional(),

  // Sentry
  NEXT_PUBLIC_SENTRY_DSN: z.string().url().optional(),

  // Cron
  CRON_SECRET: z
    .string()
    .min(16, "CRON_SECRET must be at least 16 characters")
    .optional(),

  // Shopify
  SHOPIFY_API_KEY: z.string().optional(),
  SHOPIFY_API_SECRET: z.string().optional(),

  // Upstash Redis (required for production rate limiting)
  UPSTASH_REDIS_REST_URL: z
    .string()
    .url("UPSTASH_REDIS_REST_URL must be a valid URL")
    .optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),

  // App
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
});

export type EnvConfig = z.infer<typeof envSchema>;

let _validatedEnv: EnvConfig | null = null;

/**
 * Validate environment variables. Throws on first call if critical vars are missing.
 * Subsequent calls return cached result.
 */
export function validateEnv(): EnvConfig {
  if (_validatedEnv) return _validatedEnv;

  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const errors = result.error.issues.map(
      (issue) => `  - ${issue.path.join(".")}: ${issue.message}`,
    );
    const message = `Environment validation failed:\n${errors.join("\n")}`;

    // In production, throw to prevent startup with bad config
    if (process.env.NODE_ENV === "production") {
      throw new Error(message);
    }

    // In development, warn but don't crash
    console.warn(`⚠️ ${message}`);
  }

  _validatedEnv = (
    result.success
      ? result.data
      : envSchema.parse({
          ...process.env,
          // Provide fallbacks for development
          NEXTAUTH_SECRET:
            process.env.NEXTAUTH_SECRET || "dev-secret-change-me-in-production",
          NODE_ENV: process.env.NODE_ENV || "development",
        })
  ) as EnvConfig;

  return _validatedEnv;
}

/**
 * Get a validated env variable with type safety
 */
export function getEnv<K extends keyof EnvConfig>(key: K): EnvConfig[K] {
  const env = validateEnv();
  return env[key];
}

/**
 * Check if a specific service is configured (all required vars present)
 */
export function isServiceConfigured(
  service: "stripe" | "twilio" | "email" | "openai" | "shopify" | "sentry",
): boolean {
  switch (service) {
    case "stripe":
      return (
        !!process.env.STRIPE_SECRET_KEY && !!process.env.STRIPE_WEBHOOK_SECRET
      );
    case "twilio":
      return (
        !!process.env.TWILIO_ACCOUNT_SID &&
        !!process.env.TWILIO_AUTH_TOKEN &&
        !!process.env.TWILIO_PHONE_NUMBER
      );
    case "email":
      return (
        !!process.env.RESEND_API_KEY ||
        (!!process.env.MAILGUN_API_KEY && !!process.env.MAILGUN_DOMAIN)
      );
    case "openai":
      return !!process.env.OPENAI_API_KEY;
    case "shopify":
      return !!process.env.SHOPIFY_API_KEY && !!process.env.SHOPIFY_API_SECRET;
    case "sentry":
      return !!process.env.NEXT_PUBLIC_SENTRY_DSN;
    default:
      return false;
  }
}

/**
 * Timing-safe string comparison to prevent timing attacks on secrets
 */
export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    // Still do the comparison to maintain constant time
    // but ensure lengths differ => always false
    const dummy = Buffer.from(a);
    Buffer.from(b); // consume
    dummy; // consume
    return false;
  }
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);

  // Use Node.js crypto.timingSafeEqual
  try {
    const crypto = require("crypto");
    return crypto.timingSafeEqual(bufA, bufB);
  } catch {
    // Fallback: XOR comparison (still better than ===)
    let result = 0;
    for (let i = 0; i < bufA.length; i++) {
      result |= bufA[i] ^ bufB[i];
    }
    return result === 0;
  }
}
