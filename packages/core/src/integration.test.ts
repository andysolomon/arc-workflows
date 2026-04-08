/// <reference types="node" />
/**
 * End-to-end integration tests for `@arc-workflows/core`.
 *
 * These exercise the public barrel only — no deep imports — so the
 * suite doubles as a smoke test of the package surface that consumers
 * actually see.
 */

import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { beforeEach, describe, expect, it } from 'vitest';

import {
  generate,
  getTemplate,
  listTemplates,
  loadConfig,
  validate,
  type Workflow,
  writeWorkflow,
} from './index.js';
import { ciNode, monorepoCi } from './templates/index.js';

/**
 * Loose view of `getTemplate` for tests that iterate over `TemplateId`
 * values without satisfying the per-id overload set.
 */
const getTemplateAny = getTemplate as (id: string, params?: object) => Workflow;

let tmpDir: string;

beforeEach(async () => {
  tmpDir = await mkdtemp(join(tmpdir(), 'arc-workflows-integration-'));
});

describe('integration: end-to-end scenarios', () => {
  it('config-driven template instantiation', () => {
    const wf = ciNode();
    const buildJob = wf.jobs.build;
    if (buildJob && 'runs-on' in buildJob) {
      buildJob['runs-on'] = 'ubuntu-24.04';
    }
    const result = validate(wf);
    expect(result.errors.filter((e) => e.severity === 'error')).toEqual([]);
    const yaml = generate(wf);
    expect(yaml).toContain('runs-on: ubuntu-24.04');
  });

  it('full validation pipeline runs on the monorepo-ci template', () => {
    const wf = monorepoCi();
    const result = validate(wf);
    const errors = result.errors.filter((e) => e.severity === 'error');
    expect(errors).toEqual([]);
  });

  it('writeWorkflow output matches generate output byte-for-byte', async () => {
    const wf = ciNode();
    const expectedYaml = generate(wf);
    const filePath = join(tmpDir, 'ci.yml');
    await writeWorkflow(wf, filePath);
    const actualYaml = await readFile(filePath, 'utf8');
    expect(actualYaml).toBe(expectedYaml);
  });

  it('every built-in template passes validation', () => {
    const templates = listTemplates();
    expect(templates).toHaveLength(10);
    for (const meta of templates) {
      const wf = getTemplateAny(meta.id);
      const result = validate(wf);
      const errors = result.errors.filter((e) => e.severity === 'error');
      expect(errors, `Template ${meta.id} has validation errors`).toEqual([]);
    }
  });

  it('all 10 templates produce non-empty YAML', () => {
    const templates = listTemplates();
    for (const meta of templates) {
      const wf = getTemplateAny(meta.id);
      const yaml = generate(wf);
      expect(yaml.length).toBeGreaterThan(0);
      expect(yaml).toContain('jobs:');
    }
  });

  it('loadConfig returns an empty config from a directory with no arc.config', async () => {
    const result = await loadConfig({ cwd: tmpDir });
    expect(result.source).toBeNull();
    expect(result.config).toEqual({});
  });
});
