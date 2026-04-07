import { describe, expect, it } from 'vitest';

import type { Workflow } from '../schema/index.js';

import { ciNode } from './ci-node.js';
import { getTemplate, listTemplates, TEMPLATES } from './index.js';
import type { TemplateId } from './types.js';

/**
 * Loosely-typed view of `getTemplate` for tests that need to iterate
 * over `TemplateId` values or pass an unknown id without satisfying the
 * per-id overload set.
 */
const getTemplateAny = getTemplate as (id: string, params?: object) => Workflow;

describe('templates index', () => {
  it('listTemplates() returns 10 metadata objects', () => {
    expect(listTemplates()).toHaveLength(10);
    expect(TEMPLATES).toHaveLength(10);
  });

  it('every metadata entry has id, name, description, tags', () => {
    for (const meta of listTemplates()) {
      expect(meta.id).toBeTruthy();
      expect(meta.name).toBeTruthy();
      expect(meta.description).toBeTruthy();
      expect(Array.isArray(meta.tags)).toBe(true);
      expect(meta.tags.length).toBeGreaterThan(0);
    }
  });

  it('all template ids are unique', () => {
    const ids = listTemplates().map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('getTemplate dispatches to the correct factory', () => {
    expect(getTemplate('ci-node')).toEqual(ciNode());
  });

  it('getTemplate forwards params to the factory', () => {
    const wf = getTemplate('ci-node', { nodeVersion: '22' });
    const expected = ciNode({ nodeVersion: '22' });
    expect(wf).toEqual(expected);
  });

  it('throws on unknown template id', () => {
    expect(() => getTemplateAny('not-a-template')).toThrow(/Unknown template id/);
  });

  it('all 10 ids dispatch to a Workflow', () => {
    const ids: TemplateId[] = [
      'ci-node',
      'ci-python',
      'deploy-vercel',
      'deploy-aws',
      'release-semantic',
      'docker-build',
      'cron-task',
      'manual-dispatch',
      'reusable',
      'monorepo-ci',
    ];
    for (const id of ids) {
      const wf = getTemplateAny(id);
      expect(wf.on).toBeDefined();
      expect(wf.jobs).toBeDefined();
      expect(Object.keys(wf.jobs).length).toBeGreaterThan(0);
    }
  });
});
