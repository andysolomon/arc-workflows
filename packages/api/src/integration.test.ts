/**
 * End-to-end integration: builder → API → builder.
 *
 * Builds a workflow with the fluent builder, sends it through the
 * `/api/workflows/validate`, `/api/workflows/generate`, and
 * `/api/workflows/parse` endpoints, and asserts the round-trip is
 * consistent.
 */

import { generate, type ValidationResult, type Workflow } from '@arc-workflows/core';
import { describe, expect, it } from 'vitest';

import { job, step, workflow } from './builder/index.js';
import { app } from './server/index.js';

function postJson(path: string, body: unknown): Promise<Response> {
  return app.request(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('integration: builder → API round-trip', () => {
  const built = workflow('CI')
    .on('pull_request', { branches: ['main'] })
    .job(
      job('build')
        .runsOn('ubuntu-latest')
        .step(step().uses('actions/checkout@v4'))
        .step(step().run('npm test')),
    );

  it('validate endpoint accepts the builder output', async () => {
    const res = await postJson('/api/workflows/validate', { workflow: built.toJSON() });
    expect(res.status).toBe(200);
    const body = (await res.json()) as ValidationResult;
    expect(body.valid).toBe(true);
  });

  it('generate endpoint produces the same YAML as the builder.toYAML()', async () => {
    const res = await postJson('/api/workflows/generate', { workflow: built.toJSON() });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { yaml: string };
    expect(body.yaml).toBe(built.toYAML());
  });

  it('parse endpoint round-trips the generated YAML to a workflow shape', async () => {
    const yaml = built.toYAML();
    const res = await postJson('/api/workflows/parse', { yaml });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { workflow: Workflow };
    expect(body.workflow.name).toBe('CI');
    expect(body.workflow.jobs).toBeDefined();
    expect(Object.keys(body.workflow.jobs)).toContain('build');
  });

  it('builder.toYAML() is byte-identical to core.generate(builder.toJSON())', () => {
    expect(built.toYAML()).toBe(generate(built.toJSON()));
  });
});
