/**
 * Shared error response helper for API routes.
 *
 * The hybrid format is: top-level `error` (string) plus an optional
 * `details` array of `{ path?, message }` entries that can describe
 * field-level problems (e.g., from a Zod validation failure).
 */

import type { Context } from 'hono';

export interface ErrorDetail {
  path?: (string | number)[];
  message: string;
}

export interface ErrorBody {
  error: string;
  details?: ErrorDetail[];
}

export function errorResponse(
  c: Context,
  status: 400 | 422 | 500,
  message: string,
  details?: ErrorDetail[],
) {
  const body: ErrorBody = details ? { error: message, details } : { error: message };
  return c.json(body, status);
}
