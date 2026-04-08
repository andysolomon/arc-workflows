import type { ValidationResult, Workflow } from '@arc-workflows/core';
import { describe, expect, it } from 'vitest';

import { app } from '../app.js';

const validWorkflow: Workflow = {
  name: 'CI',
  on: { push: { branches: ['main'] } },
  jobs: {
    build: {
      'runs-on': 'ubuntu-latest',
      steps: [{ run: 'echo hi' }],
    },
  },
};

function postJson(path: string, body: unknown): Promise<Response> {
  return app.request(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/workflows/validate', () => {
  it('returns 200 + valid result for a clean workflow', async () => {
    const res = await postJson('/api/workflows/validate', { workflow: validWorkflow });
    expect(res.status).toBe(200);
    const body = (await res.json()) as ValidationResult;
    expect(body.valid).toBe(true);
  });

  it('returns 400 when the request body is missing the workflow field', async () => {
    const res = await postJson('/api/workflows/validate', {});
    expect(res.status).toBe(400);
  });

  it('returns 200 + valid:false with errors when the workflow has problems', async () => {
    // No jobs at all — core validation should reject.
    const broken = { name: 'broken', on: { push: {} }, jobs: {} };
    const res = await postJson('/api/workflows/validate', { workflow: broken });
    expect(res.status).toBe(200);
    const body = (await res.json()) as ValidationResult;
    expect(body.valid).toBe(false);
    expect(body.errors.length).toBeGreaterThan(0);
  });
});

describe('POST /api/workflows/generate', () => {
  it('returns 200 + yaml string', async () => {
    const res = await postJson('/api/workflows/generate', { workflow: validWorkflow });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { yaml: string };
    expect(body.yaml).toContain('jobs:');
    expect(body.yaml).toContain('runs-on: ubuntu-latest');
  });

  it('respects the header option', async () => {
    const res = await postJson('/api/workflows/generate', {
      workflow: validWorkflow,
      options: { header: 'AUTO-GENERATED' },
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { yaml: string };
    expect(body.yaml).toContain('AUTO-GENERATED');
  });

  it('returns 400 when the request body is malformed', async () => {
    const res = await postJson('/api/workflows/generate', { notWorkflow: 1 });
    expect(res.status).toBe(400);
  });
});

describe('POST /api/workflows/parse', () => {
  it('returns 200 + workflow object for canonical YAML', async () => {
    const yaml = [
      'name: CI',
      'on:',
      '  push:',
      '    branches:',
      '      - main',
      'jobs:',
      '  build:',
      '    runs-on: ubuntu-latest',
      '    steps:',
      '      - run: echo hi',
      '',
    ].join('\n');
    const res = await postJson('/api/workflows/parse', { yaml });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { workflow: Workflow };
    expect(body.workflow.name).toBe('CI');
    expect(body.workflow.jobs).toBeDefined();
  });

  it('returns 422 for invalid YAML', async () => {
    const res = await postJson('/api/workflows/parse', { yaml: 'this:\n  is: : not yaml: : :' });
    expect(res.status).toBe(422);
  });

  it('returns 400 when the request body is missing yaml', async () => {
    const res = await postJson('/api/workflows/parse', {});
    expect(res.status).toBe(400);
  });
});
