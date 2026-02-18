/**
 * Sentry Server Configuration
 * This file configures Sentry error tracking for the Node.js server side.
 */

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Performance monitoring
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.2 : 1.0,

  // Only enable when DSN is configured
  enabled: !!(process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN),

  environment: process.env.NODE_ENV || "development",

  beforeSend(event: Sentry.ErrorEvent) {
    // Strip sensitive data from server errors
    if (event.request?.headers) {
      delete event.request.headers["authorization"];
      delete event.request.headers["cookie"];
    }
    // Strip query params that might contain tokens
    if (event.request?.query_string) {
      const params = new URLSearchParams(event.request.query_string);
      for (const key of params.keys()) {
        if (
          key.toLowerCase().includes("token") ||
          key.toLowerCase().includes("key")
        ) {
          params.set(key, "[REDACTED]");
        }
      }
      event.request.query_string = params.toString();
    }
    return event;
  },
});
