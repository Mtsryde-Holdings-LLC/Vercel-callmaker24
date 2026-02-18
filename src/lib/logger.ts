/**
 * Structured Logger for CallMaker24
 * Provides consistent, structured logging with request context
 * Replace console.log/error with this for production-grade observability
 * Integrates with Sentry for error tracking
 */

import * as Sentry from '@sentry/nextjs';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  requestId?: string | null;
  organizationId?: string | null;
  userId?: string | null;
  route?: string;
  [key: string]: unknown;
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: LogContext;
  error?: {
    message: string;
    name: string;
    stack?: string;
  };
}

function formatEntry(entry: LogEntry): string {
  const { timestamp, level, message, context, error } = entry;
  const prefix = context?.route ? `[${context.route}]` : '';
  const orgPrefix = context?.organizationId ? `[org:${context.organizationId}]` : '';
  const reqPrefix = context?.requestId ? `[req:${context.requestId}]` : '';
  
  const parts = [timestamp, level.toUpperCase(), reqPrefix, orgPrefix, prefix, message].filter(Boolean);
  
  if (error) {
    return `${parts.join(' ')} | error: ${error.message}${error.stack ? `\n${error.stack}` : ''}`;
  }
  
  return parts.join(' ');
}

function createLogEntry(level: LogLevel, message: string, context?: LogContext, error?: unknown): LogEntry {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    context,
  };

  if (error instanceof Error) {
    entry.error = {
      message: error.message,
      name: error.name,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    };
  } else if (error) {
    entry.error = {
      message: String(error),
      name: 'UnknownError',
    };
  }

  return entry;
}

export const logger = {
  debug(message: string, context?: LogContext) {
    if (process.env.NODE_ENV === 'development') {
      const entry = createLogEntry('debug', message, context);
      console.debug(formatEntry(entry));
    }
  },

  info(message: string, context?: LogContext) {
    const entry = createLogEntry('info', message, context);
    console.log(formatEntry(entry));
  },

  warn(message: string, context?: LogContext, error?: unknown) {
    const entry = createLogEntry('warn', message, context, error);
    console.warn(formatEntry(entry));
  },

  error(message: string, context?: LogContext, error?: unknown) {
    const entry = createLogEntry('error', message, context, error);
    console.error(formatEntry(entry));
    
    // Report to Sentry
    if (error instanceof Error) {
      Sentry.captureException(error, {
        tags: {
          route: context?.route,
          organizationId: context?.organizationId,
        },
        extra: {
          requestId: context?.requestId,
          message,
        },
      });
    } else if (error) {
      Sentry.captureMessage(message, {
        level: 'error',
        tags: {
          route: context?.route,
          organizationId: context?.organizationId,
        },
        extra: {
          requestId: context?.requestId,
          rawError: String(error),
        },
      });
    }
  },

  /** Create a child logger with pre-set context (e.g., route name) */
  child(defaultContext: LogContext) {
    return {
      debug: (message: string, context?: LogContext) =>
        logger.debug(message, { ...defaultContext, ...context }),
      info: (message: string, context?: LogContext) =>
        logger.info(message, { ...defaultContext, ...context }),
      warn: (message: string, context?: LogContext, error?: unknown) =>
        logger.warn(message, { ...defaultContext, ...context }, error),
      error: (message: string, context?: LogContext, error?: unknown) =>
        logger.error(message, { ...defaultContext, ...context }, error),
    };
  },
};

/**
 * Sanitize error for client response - NEVER expose error.message or stack to clients
 */
export function sanitizeErrorForClient(error: unknown, fallbackMessage: string): string {
  // Log the real error server-side
  if (error instanceof Error) {
    console.error(`[SANITIZED] ${error.message}`, error.stack);
  }
  
  // Check for known safe error types
  if (error && typeof error === 'object' && 'code' in error) {
    const prismaError = error as { code?: string };
    if (prismaError.code === 'P2002') {
      return 'A record with this information already exists';
    }
    if (prismaError.code === 'P2025') {
      return 'Record not found';
    }
  }
  
  return fallbackMessage;
}

/**
 * Generate a unique request ID for tracing
 */
export function generateRequestId(): string {
  return `req_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 8)}`;
}
