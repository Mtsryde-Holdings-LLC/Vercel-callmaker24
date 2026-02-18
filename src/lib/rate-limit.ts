/**
 * API Rate Limiter for CallMaker24
 * Uses Upstash Redis for distributed rate limiting on Vercel serverless.
 * Falls back to in-memory for local development when UPSTASH_REDIS_REST_URL is not set.
 */

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

export interface RateLimitConfig {
  /** Max requests per window */
  maxRequests: number;
  /** Time window in seconds */
  windowSeconds: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  retryAfterSeconds?: number;
}

/** Default rate limits by route category */
export const RATE_LIMITS = {
  /** Standard API routes - 60 req/min */
  standard: { maxRequests: 60, windowSeconds: 60 } as RateLimitConfig,
  /** Auth routes (login, register) - 10 req/min */
  auth: { maxRequests: 10, windowSeconds: 60 } as RateLimitConfig,
  /** AI generation routes - 20 req/min */
  ai: { maxRequests: 20, windowSeconds: 60 } as RateLimitConfig,
  /** Webhook routes - 100 req/min */
  webhook: { maxRequests: 100, windowSeconds: 60 } as RateLimitConfig,
  /** Admin routes - 30 req/min */
  admin: { maxRequests: 30, windowSeconds: 60 } as RateLimitConfig,
  /** Chatbot - 30 req/min per user */
  chatbot: { maxRequests: 30, windowSeconds: 60 } as RateLimitConfig,
};

/* ────────────────────────────────────────────
 * Upstash Redis client (singleton)
 * ──────────────────────────────────────────── */
let redis: Redis | null = null;

function getRedis(): Redis | null {
  if (redis) return redis;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  redis = new Redis({ url, token });
  return redis;
}

/* ────────────────────────────────────────────
 * Upstash rate limiter cache
 * Key = "maxRequests:windowSeconds"
 * ──────────────────────────────────────────── */
const limiterCache = new Map<string, Ratelimit>();

function getUpstashLimiter(config: RateLimitConfig): Ratelimit | null {
  const r = getRedis();
  if (!r) return null;

  const cacheKey = `${config.maxRequests}:${config.windowSeconds}`;
  let limiter = limiterCache.get(cacheKey);
  if (!limiter) {
    limiter = new Ratelimit({
      redis: r,
      limiter: Ratelimit.slidingWindow(
        config.maxRequests,
        `${config.windowSeconds} s`,
      ),
      analytics: true,
      prefix: "callmaker24:rl",
    });
    limiterCache.set(cacheKey, limiter);
  }
  return limiter;
}

/* ────────────────────────────────────────────
 * In-memory fallback (development only)
 * ──────────────────────────────────────────── */
interface InMemoryEntry {
  count: number;
  resetAt: number;
}
const memoryStore = new Map<string, InMemoryEntry>();

if (typeof setInterval !== "undefined") {
  setInterval(
    () => {
      const now = Date.now();
      for (const [key, entry] of memoryStore) {
        if (entry.resetAt <= now) memoryStore.delete(key);
      }
    },
    5 * 60 * 1000,
  );
}

function checkInMemory(key: string, config: RateLimitConfig): RateLimitResult {
  const now = Date.now();
  const entry = memoryStore.get(key);

  if (!entry || entry.resetAt <= now) {
    memoryStore.set(key, {
      count: 1,
      resetAt: now + config.windowSeconds * 1000,
    });
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetAt: now + config.windowSeconds * 1000,
    };
  }

  if (entry.count >= config.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: entry.resetAt,
      retryAfterSeconds: Math.ceil((entry.resetAt - now) / 1000),
    };
  }

  entry.count++;
  return {
    allowed: true,
    remaining: config.maxRequests - entry.count,
    resetAt: entry.resetAt,
  };
}

/* ────────────────────────────────────────────
 * Public API (unchanged signatures)
 * ──────────────────────────────────────────── */

/**
 * Check rate limit for a given key.
 * Prefers Upstash Redis; falls back to in-memory when env vars are missing.
 */
export async function checkRateLimit(
  key: string,
  config: RateLimitConfig,
): Promise<RateLimitResult> {
  const limiter = getUpstashLimiter(config);

  if (limiter) {
    const { success, remaining, reset } = await limiter.limit(key);
    return {
      allowed: success,
      remaining,
      resetAt: reset,
      retryAfterSeconds: success
        ? undefined
        : Math.ceil((reset - Date.now()) / 1000),
    };
  }

  // Fallback: in-memory (dev only)
  return checkInMemory(key, config);
}

/**
 * Get the rate limit key from a request.
 * Uses IP address, falling back to a generic key.
 */
export function getRateLimitKey(
  request: Request,
  prefix: string = "api",
): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip =
    forwarded?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";
  return `${prefix}:${ip}`;
}

/**
 * Apply rate limiting to a request.
 * Returns a 429 payload if rate limited, or null if allowed.
 */
export async function applyRateLimit(
  request: Request,
  config: RateLimitConfig,
  prefix?: string,
): Promise<{
  status: 429;
  body: { error: string; retryAfter?: number };
  headers: Record<string, string>;
} | null> {
  const key = getRateLimitKey(request, prefix);
  const result = await checkRateLimit(key, config);

  if (!result.allowed) {
    return {
      status: 429,
      body: {
        error: "Too many requests",
        retryAfter: result.retryAfterSeconds,
      },
      headers: {
        "Content-Type": "application/json",
        "Retry-After": String(result.retryAfterSeconds || 60),
        "X-RateLimit-Limit": String(config.maxRequests),
        "X-RateLimit-Remaining": "0",
        "X-RateLimit-Reset": String(Math.ceil(result.resetAt / 1000)),
      },
    };
  }

  return null;
}
