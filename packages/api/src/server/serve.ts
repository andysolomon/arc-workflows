/**
 * Node.js server bootstrap for the Hono app.
 */

import { serve as honoServe } from '@hono/node-server';

import { app } from './app.js';

export interface ServeOptions {
  port?: number;
  hostname?: string;
}

/**
 * Start the API server on Node.js using `@hono/node-server`.
 *
 * @example
 * ```ts
 * import { serve } from '@arc-workflows/api';
 * serve({ port: 3000 });
 * ```
 */
export function serve(options: ServeOptions = {}): ReturnType<typeof honoServe> {
  const opts: { fetch: typeof app.fetch; port: number; hostname?: string } = {
    fetch: app.fetch,
    port: options.port ?? 3000,
  };
  if (options.hostname !== undefined) opts.hostname = options.hostname;
  return honoServe(opts);
}
