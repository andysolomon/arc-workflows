/**
 * The Hono application instance, with routes mounted under `/api/*`.
 *
 * Exported as a plain `Hono` app so it can be tested via the in-memory
 * `app.request()` API or served via `@hono/node-server` (see `serve.ts`).
 */

import { Hono } from 'hono';

import { templatesRoute } from './routes/templates.js';
import { workflowsRoute } from './routes/workflows.js';

export const app = new Hono();

app.route('/api/templates', templatesRoute);
app.route('/api/workflows', workflowsRoute);

app.onError((_err, c) => {
  return c.json({ error: 'Internal Server Error' }, 500);
});

app.notFound((c) => {
  return c.json({ error: 'Not Found' }, 404);
});
