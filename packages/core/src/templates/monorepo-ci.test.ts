import { describe, expect, it } from 'vitest';

import { generate } from '../generate/index.js';
import { validate } from '../validation/index.js';

import { monorepoCi } from './monorepo-ci.js';

describe('monorepo-ci template', () => {
  it('returns a Workflow with a changes job and per-package jobs', () => {
    const wf = monorepoCi();
    expect(wf.jobs.changes).toBeDefined();
    expect(Object.keys(wf.jobs).length).toBeGreaterThan(1);
  });

  it('passes validation with default params', () => {
    const result = validate(monorepoCi());
    expect(result.errors.filter((e) => e.severity === 'error')).toEqual([]);
    expect(result.valid).toBe(true);
  });

  it('generates expected YAML with default params', () => {
    expect(generate(monorepoCi())).toMatchInlineSnapshot(`
      "name: Monorepo CI
      on:
        pull_request:
          branches:
            - main
          paths:
            - packages/a/**
            - packages/b/**
      jobs:
        changes:
          runs-on: ubuntu-latest
          outputs:
            packages-a: \${{ steps.filter.outputs.packages-a }}
            packages-b: \${{ steps.filter.outputs.packages-b }}
          steps:
            - uses: actions/checkout@v4
            - id: filter
              uses: dorny/paths-filter@v3
              with:
                filters: |-
                  packages-a: 'packages/a/**'
                  packages-b: 'packages/b/**'
        packages-a-ci:
          runs-on: ubuntu-latest
          needs: changes
          if: needs.changes.outputs.packages-a == 'true'
          steps:
            - uses: actions/checkout@v4
            - run: echo "Building packages/a"
        packages-b-ci:
          runs-on: ubuntu-latest
          needs: changes
          if: needs.changes.outputs.packages-b == 'true'
          steps:
            - uses: actions/checkout@v4
            - run: echo "Building packages/b"
      "
    `);
  });

  it('creates a slugified job per package', () => {
    const wf = monorepoCi({ packages: ['packages/api', 'apps/web'] });
    expect(wf.jobs['packages-api-ci']).toBeDefined();
    expect(wf.jobs['apps-web-ci']).toBeDefined();
  });

  it('respects branch override', () => {
    const yaml = generate(monorepoCi({ branch: 'develop' }));
    expect(yaml).toContain('- develop');
  });

  it('passes validation with custom packages', () => {
    const result = validate(monorepoCi({ packages: ['packages/api', 'apps/web'] }));
    expect(result.errors.filter((e) => e.severity === 'error')).toEqual([]);
    expect(result.valid).toBe(true);
  });
});
