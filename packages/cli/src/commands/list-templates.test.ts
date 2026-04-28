import { afterEach, describe, expect, it, vi } from 'vitest';
import { runListTemplates } from './list-templates.js';

const EXPECTED_IDS = [
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

describe('runListTemplates', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns 0 and prints all 10 template ids', () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    const exit = runListTemplates();
    expect(exit).toBe(0);
    const output = log.mock.calls.map((c) => String(c[0])).join('\n');
    for (const id of EXPECTED_IDS) {
      expect(output).toContain(id);
    }
  });

  it('prints the "Available templates" heading', () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    runListTemplates();
    const output = log.mock.calls.map((c) => String(c[0])).join('\n');
    expect(output).toContain('Available templates');
  });
});
