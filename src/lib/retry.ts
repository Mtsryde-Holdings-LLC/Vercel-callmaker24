/**
 * Retry utility with exponential backoff
 * For resilient external API calls (Twilio, Stripe, OpenAI, Shopify, Mailgun)
 */

import { logger } from './logger';

export interface RetryOptions {
  /** Maximum number of retry attempts (default: 3) */
  maxRetries?: number;
  /** Initial delay in ms before first retry (default: 1000) */
  initialDelayMs?: number;
  /** Maximum delay in ms between retries (default: 10000) */
  maxDelayMs?: number;
  /** Backoff multiplier (default: 2) */
  backoffMultiplier?: number;
  /** Function to determine if error is retryable (default: all errors) */
  isRetryable?: (error: unknown) => boolean;
  /** Context label for logging */
  label?: string;
}

/** Default retryable check — retry on network/timeout errors, 429, 5xx */
export function isRetryableError(error: unknown): boolean {
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    // Network errors
    if (msg.includes('econnreset') || msg.includes('econnrefused') ||
        msg.includes('etimedout') || msg.includes('socket hang up') ||
        msg.includes('network') || msg.includes('fetch failed')) {
      return true;
    }
  }

  // HTTP status code based
  if (error && typeof error === 'object' && 'status' in error) {
    const status = (error as { status: number }).status;
    return status === 429 || status >= 500;
  }
  if (error && typeof error === 'object' && 'statusCode' in error) {
    const status = (error as { statusCode: number }).statusCode;
    return status === 429 || status >= 500;
  }

  return false;
}

/**
 * Execute a function with retry logic and exponential backoff.
 * 
 * @example
 * const result = await withRetry(
 *   () => twilio.messages.create({ ... }),
 *   { label: 'twilio-send-sms', maxRetries: 3 }
 * );
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelayMs = 1000,
    maxDelayMs = 10000,
    backoffMultiplier = 2,
    isRetryable = isRetryableError,
    label = 'operation',
  } = options;

  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt === maxRetries || !isRetryable(error)) {
        logger.error(`${label} failed after ${attempt + 1} attempt(s)`, {
          route: label,
        }, error);
        throw error;
      }

      const delay = Math.min(
        initialDelayMs * Math.pow(backoffMultiplier, attempt),
        maxDelayMs
      );
      // Add jitter: ±25% randomization to prevent thundering herd
      const jitter = delay * 0.25 * (Math.random() * 2 - 1);
      const actualDelay = Math.round(delay + jitter);

      logger.warn(
        `${label} attempt ${attempt + 1}/${maxRetries + 1} failed, retrying in ${actualDelay}ms`,
        { route: label }
      );

      await new Promise(resolve => setTimeout(resolve, actualDelay));
    }
  }

  throw lastError;
}

/** Pre-configured retry options for common services */
export const RETRY_CONFIGS = {
  /** Twilio: 3 retries, fast backoff */
  twilio: {
    maxRetries: 3,
    initialDelayMs: 500,
    label: 'twilio',
    isRetryable: isRetryableError,
  } satisfies RetryOptions,

  /** Stripe: 3 retries, standard backoff */
  stripe: {
    maxRetries: 3,
    initialDelayMs: 1000,
    label: 'stripe',
    isRetryable: isRetryableError,
  } satisfies RetryOptions,

  /** OpenAI: 2 retries, longer backoff (expensive) */
  openai: {
    maxRetries: 2,
    initialDelayMs: 2000,
    maxDelayMs: 15000,
    label: 'openai',
    isRetryable: isRetryableError,
  } satisfies RetryOptions,

  /** Shopify: 3 retries with rate limit awareness */
  shopify: {
    maxRetries: 3,
    initialDelayMs: 1000,
    label: 'shopify',
    isRetryable: isRetryableError,
  } satisfies RetryOptions,

  /** Email (Mailgun/Resend): 3 retries */
  email: {
    maxRetries: 3,
    initialDelayMs: 1000,
    label: 'email',
    isRetryable: isRetryableError,
  } satisfies RetryOptions,
} as const;
