import type { TemplateMetadata, Workflow } from '@arc-workflows/core';
import { describe, expect, it } from 'vitest';

import { app } from '../app.js';

describe('GET /api/templates', () => {
  it('returns 200 with the list of all 10 built-in templates', async () => {
    const res = await app.request('/api/templates');
    expect(res.status).toBe(200);
    const body = (await res.json()) as { templates: TemplateMetadata[] };
    expect(body.templates).toHaveLength(10);
    for (const t of body.templates) {
      expect(typeof t.id).toBe('string');
      expect(typeof t.name).toBe('string');
    }
  });
});

describe('GET /api/templates/:id', () => {
  it('returns 200 with a workflow for ci-node', async () => {
    const res = await app.request('/api/templates/ci-node');
    expect(res.status).toBe(200);
    const body = (await res.json()) as { workflow: Workflow };
    expect(body.workflow).toBeDefined();
    expect(body.workflow.jobs).toBeDefined();
  });

  it('returns 400 for unknown template ids', async () => {
    const res = await app.request('/api/templates/not-a-template');
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toMatch(/Unknown template id/);
  });
});
