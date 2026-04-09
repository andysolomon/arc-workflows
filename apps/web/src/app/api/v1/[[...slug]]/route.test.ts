import { describe, it, expect } from 'vitest';
import { GET } from './route';

describe('API mount at /api/v1/[[...slug]]', () => {
  it('returns 10 templates from the mounted Hono app', async () => {
    const req = new Request('http://localhost/api/v1/templates', { method: 'GET' });
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = (await res.json()) as { templates: unknown[] };
    expect(Array.isArray(body.templates)).toBe(true);
    expect(body.templates.length).toBe(10);
  });

  it('returns 404 for unknown routes', async () => {
    const req = new Request('http://localhost/api/v1/nope', { method: 'GET' });
    const res = await GET(req);
    expect(res.status).toBe(404);
  });
});
