import { describe, expect, it } from 'vitest';

import { generate } from '../generate/index.js';
import { validate } from '../validation/index.js';

import { deployVercel } from './deploy-vercel.js';

describe('deploy-vercel template', () => {
  it('returns a Workflow', () => {
    const wf = deployVercel();
    expect(wf.jobs.deploy).toBeDefined();
  });

  it('passes validation with default params', () => {
    const result = validate(deployVercel());
    expect(result.errors.filter((e) => e.severity === 'error')).toEqual([]);
    expect(result.valid).toBe(true);
  });

  it('generates expected YAML with default params', () => {
    expect(generate(deployVercel())).toMatchInlineSnapshot(`
      "name: Deploy to Vercel
      on:
        push:
          branches:
            - main
      jobs:
        deploy:
          runs-on: ubuntu-latest
          env:
            VERCEL_ORG_ID: \${{ secrets.VERCEL_ORG_ID }}
            VERCEL_PROJECT_ID: \${{ secrets.VERCEL_PROJECT_ID }}
          steps:
            - uses: actions/checkout@v4
            - uses: actions/setup-node@v4
              with:
                node-version: lts/*
            - run: npm install --global vercel@latest
            - run: vercel pull --yes --environment=production --token=\${{ secrets.VERCEL_TOKEN }}
            - run: vercel build --prod --token=\${{ secrets.VERCEL_TOKEN }}
            - run: vercel deploy --prebuilt --prod --token=\${{ secrets.VERCEL_TOKEN }}
      "
    `);
  });

  it('uses --prod for production environment', () => {
    const yaml = generate(deployVercel({ environment: 'production' }));
    expect(yaml).toContain('vercel build --prod');
    expect(yaml).toContain('vercel deploy --prebuilt --prod');
  });

  it('omits --prod for non-production environment', () => {
    const yaml = generate(deployVercel({ environment: 'preview' }));
    expect(yaml).toContain('--environment=preview');
    expect(yaml).not.toContain('vercel build --prod');
  });

  it('respects branch override', () => {
    const yaml = generate(deployVercel({ branch: 'release' }));
    expect(yaml).toContain('- release');
  });
});
