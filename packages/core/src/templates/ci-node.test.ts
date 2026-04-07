import { describe, expect, it } from 'vitest';

import { generate } from '../generate/index.js';
import { validate } from '../validation/index.js';

import { ciNode } from './ci-node.js';

describe('ci-node template', () => {
  it('returns a Workflow with on and jobs', () => {
    const wf = ciNode();
    expect(wf.on).toBeDefined();
    expect(wf.jobs).toBeDefined();
    expect(wf.jobs.build).toBeDefined();
  });

  it('passes validation with default params', () => {
    const result = validate(ciNode());
    expect(result.errors.filter((e) => e.severity === 'error')).toEqual([]);
    expect(result.valid).toBe(true);
  });

  it('generates expected YAML with default params', () => {
    expect(generate(ciNode())).toMatchInlineSnapshot(`
      "name: CI
      on:
        pull_request:
          branches:
            - main
      jobs:
        build:
          runs-on: ubuntu-latest
          steps:
            - uses: actions/checkout@v4
            - uses: actions/setup-node@v4
              with:
                node-version: lts/*
                cache: npm
            - run: npm ci
            - run: npm run lint
            - run: npm test
      "
    `);
  });

  it('respects nodeVersion override', () => {
    const yaml = generate(ciNode({ nodeVersion: '20' }));
    expect(yaml).toMatch(/node-version: ["']20["']/);
  });

  it('respects packageManager override (pnpm)', () => {
    const yaml = generate(ciNode({ packageManager: 'pnpm' }));
    expect(yaml).toContain('pnpm install --frozen-lockfile');
    expect(yaml).toContain('pnpm run lint');
    expect(yaml).toContain('pnpm test');
    expect(yaml).toContain('cache: pnpm');
  });

  it('respects packageManager override (yarn)', () => {
    const yaml = generate(ciNode({ packageManager: 'yarn' }));
    expect(yaml).toContain('yarn install --frozen-lockfile');
  });

  it('respects branch override', () => {
    const yaml = generate(ciNode({ branch: 'develop' }));
    expect(yaml).toContain('- develop');
  });
});
