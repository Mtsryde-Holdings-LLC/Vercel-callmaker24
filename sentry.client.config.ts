/**
 * Sentry Client Configuration
 * This file configures Sentry error tracking for the browser/client side.
 * Docs: https://docs.sentry.io/platforms/javascript/guides/nextjs/
 */

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Performance monitoring
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  // Session replay for debugging (1% production, 100% on error)
  replaysSessionSampleRate: 0.01,
  replaysOnErrorSampleRate: 1.0,

  // Only enable in production or when DSN is set
  enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,

  environment: process.env.NODE_ENV || "development",

  // Filter out noisy errors
  ignoreErrors: [
    // Browser extensions
    "top.GLOBALS",
    "ResizeObserver loop",
    // Network errors users cause
    "Failed to fetch",
    "Load failed",
    "NetworkError",
    "AbortError",
    // Next.js hydration (usually benign)
    "Hydration failed",
    "Text content does not match",
  ],

  beforeSend(event: Sentry.ErrorEvent) {
    // Don't send events in development unless DSN is explicitly set
    if (
      process.env.NODE_ENV === "development" &&
      !process.env.NEXT_PUBLIC_SENTRY_DSN
    ) {
      return null;
    }
    return event;
  },
});
