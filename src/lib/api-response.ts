/**
 * Standardized API Response Helper
 * Provides consistent response format across all API routes
 * Format: { success: boolean, data?: T, error?: string, meta?: object }
 */

import { NextResponse } from 'next/server';
import { logger, generateRequestId } from './logger';

interface ApiSuccessResponse<T = unknown> {
  success: true;
  data: T;
  meta?: Record<string, unknown>;
}

interface ApiErrorResponse {
  success: false;
  error: string;
  code?: string;
  meta?: Record<string, unknown>;
}

type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;

/** Standard headers to include in all API responses */
function getStandardHeaders(requestId: string): Record<string, string> {
  return {
    'X-Request-Id': requestId,
    'X-Content-Type-Options': 'nosniff',
    'Cache-Control': 'no-store',
  };
}

/**
 * Return a success response with consistent format
 */
export function apiSuccess<T>(data: T, options?: {
  status?: number;
  meta?: Record<string, unknown>;
  requestId?: string;
}): NextResponse<ApiSuccessResponse<T>> {
  const requestId = options?.requestId || generateRequestId();
  const body: ApiSuccessResponse<T> = { success: true, data };
  if (options?.meta) body.meta = options.meta;

  return NextResponse.json(body, {
    status: options?.status || 200,
    headers: getStandardHeaders(requestId),
  });
}

/**
 * Return an error response with consistent format.
 * NEVER pass raw error.message to userMessage — use a generic string.
 */
export function apiError(userMessage: string, options?: {
  status?: number;
  code?: string;
  meta?: Record<string, unknown>;
  requestId?: string;
  /** The real error — logged server-side, NEVER sent to client */
  cause?: unknown;
  route?: string;
}): NextResponse<ApiErrorResponse> {
  const requestId = options?.requestId || generateRequestId();
  const status = options?.status || 500;

  // Log the real error server-side
  if (options?.cause) {
    logger.error(userMessage, {
      requestId,
      route: options.route,
    }, options.cause);
  }

  const body: ApiErrorResponse = { success: false, error: userMessage };
  if (options?.code) body.code = options.code;
  if (options?.meta) body.meta = options.meta;

  return NextResponse.json(body, {
    status,
    headers: getStandardHeaders(requestId),
  });
}

/**
 * Return a 401 Unauthorized response
 */
export function apiUnauthorized(requestId?: string): NextResponse<ApiErrorResponse> {
  return apiError('Authentication required', { status: 401, code: 'UNAUTHORIZED', requestId });
}

/**
 * Return a 403 Forbidden response
 */
export function apiForbidden(message = 'Access denied', requestId?: string): NextResponse<ApiErrorResponse> {
  return apiError(message, { status: 403, code: 'FORBIDDEN', requestId });
}

/**
 * Return a 404 Not Found response
 */
export function apiNotFound(resource = 'Resource', requestId?: string): NextResponse<ApiErrorResponse> {
  return apiError(`${resource} not found`, { status: 404, code: 'NOT_FOUND', requestId });
}

/**
 * Return a 400 Bad Request response
 */
export function apiBadRequest(message: string, requestId?: string): NextResponse<ApiErrorResponse> {
  return apiError(message, { status: 400, code: 'BAD_REQUEST', requestId });
}

/**
 * Return a 422 Validation Error response
 */
export function apiValidationError(message: string, errors?: Record<string, string[]>, requestId?: string): NextResponse<ApiErrorResponse> {
  return apiError(message, {
    status: 422,
    code: 'VALIDATION_ERROR',
    meta: errors ? { fieldErrors: errors } : undefined,
    requestId,
  });
}
