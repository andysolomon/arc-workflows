/**
 * Next.js App Router catch-all that mounts the `@arc-workflows/api` Hono
 * app under `/api/v1/*`.
 *
 * The upstream Hono app exposes its routes at `/api/templates`,
 * `/api/workflows`, etc. We expose them under `/api/v1/*` from Next.js and
 * rewrite the incoming URL to drop the `/v1` segment before handing off
 * to Hono, so a browser request to `/api/v1/templates` is dispatched as
 * `/api/templates` inside the Hono app.
 */

import { app } from '@arc-workflows/api';
import { handle } from 'hono/vercel';

export const runtime = 'nodejs';

const honoHandler = handle(app);

function rewrite(request: Request): Request {
  const url = new URL(request.url);
  if (url.pathname.startsWith('/api/v1/')) {
    url.pathname = '/api' + url.pathname.slice('/api/v1'.length);
  } else if (url.pathname === '/api/v1') {
    url.pathname = '/api';
  }
  // Build init explicitly. Passing the original Request as init copies its
  // `signal` field, which Node 22 (strict) rejects with a TypeError because
  // AbortSignal validation fails across realm boundaries. Construct a fresh
  // RequestInit with only the fields Hono needs.
  const init: RequestInit & { duplex?: 'half' } = {
    method: request.method,
    headers: request.headers,
  };
  if (request.body) {
    init.body = request.body;
    init.duplex = 'half';
  }
  return new Request(url.toString(), init);
}

function wrap(): (req: Request) => Response | Promise<Response> {
  return (req) => honoHandler(rewrite(req));
}

export const GET = wrap();
export const POST = wrap();
export const PUT = wrap();
export const DELETE = wrap();
export const PATCH = wrap();
export const OPTIONS = wrap();
