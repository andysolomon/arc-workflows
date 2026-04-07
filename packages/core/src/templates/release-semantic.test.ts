import { describe, expect, it } from 'vitest';

import { generate } from '../generate/index.js';
import { validate } from '../validation/index.js';

import { releaseSemantic } from './release-semantic.js';

describe('release-semantic template', () => {
  it('returns a Workflow', () => {
    const wf = releaseSemantic();
    expect(wf.jobs.release).toBeDefined();
    expect(wf.permissions).toBeDefined();
  });

  it('passes validation with default params', () => {
    const result = validate(releaseSemantic());
    expect(result.errors.filter((e) => e.severity === 'error')).toEqual([]);
    expect(result.valid).toBe(true);
  });

  it('generates expected YAML with default params', () => {
    expect(generate(releaseSemantic())).toMatchInlineSnapshot(`
      "name: Release
      on:
        push:
          branches:
            - main
      permissions:
        contents: write
        issues: write
        pull-requests: write
      jobs:
        release:
          runs-on: ubuntu-latest
          steps:
            - uses: actions/checkout@v4
              with:
                fetch-depth: 0
            - uses: actions/setup-node@v4
              with:
                node-version: lts/*
            - run: npm ci
            - run: npx semantic-release
              env:
                GITHUB_TOKEN: \${{ secrets.GITHUB_TOKEN }}
                NPM_TOKEN: \${{ secrets.NPM_TOKEN }}
      "
    `);
  });

  it('respects nodeVersion override', () => {
    const yaml = generate(releaseSemantic({ nodeVersion: '22' }));
    expect(yaml).toMatch(/node-version: ["']22["']/);
  });

  it('respects branch override', () => {
    const yaml = generate(releaseSemantic({ branch: 'next' }));
    expect(yaml).toContain('- next');
  });
});
