import { describe, expect, it } from 'vitest';

import { app } from './app.js';

describe('app', () => {
  it('returns 404 with json body for unknown routes', async () => {
    const res = await app.request('/unknown');
    expect(res.status).toBe(404);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe('Not Found');
  });

  it('responds to GET /api/templates with 200', async () => {
    const res = await app.request('/api/templates');
    expect(res.status).toBe(200);
  });
});
