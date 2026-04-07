import { describe, expect, it } from 'vitest';

import type { Workflow } from '../schema/index.js';

import { serializeWorkflow } from './serializer.js';

describe('serializeWorkflow', () => {
  it('emits a Document whose toString contains keys in canonical order', () => {
    const wf: Workflow = {
      name: 'CI',
      on: { push: { branches: ['main'] } },
      jobs: {
        build: {
          'runs-on': 'ubuntu-latest',
          steps: [{ uses: 'actions/checkout@v4' }],
        },
      },
    };
    const yaml = serializeWorkflow(wf).toString({ lineWidth: 0 });
    const nameIdx = yaml.indexOf('name:');
    const onIdx = yaml.indexOf('on:');
    const jobsIdx = yaml.indexOf('jobs:');
    expect(nameIdx).toBeGreaterThanOrEqual(0);
    expect(onIdx).toBeGreaterThan(nameIdx);
    expect(jobsIdx).toBeGreaterThan(onIdx);
  });

  it('omits job fields whose value is undefined', () => {
    const wf: Workflow = {
      on: { push: {} },
      jobs: {
        build: {
          'runs-on': 'ubuntu-latest',
          name: undefined,
          if: undefined,
          steps: [{ uses: 'actions/checkout@v4' }],
        } as unknown as Workflow['jobs'][string],
      },
    };
    const yaml = serializeWorkflow(wf).toString({ lineWidth: 0 });
    expect(yaml).not.toMatch(/\bname:/);
    expect(yaml).not.toMatch(/\bif:/);
    expect(yaml).toContain('runs-on: ubuntu-latest');
  });

  it('treats reusable workflow call jobs distinctly from normal jobs', () => {
    const wf: Workflow = {
      on: { push: {} },
      jobs: {
        deploy: {
          uses: './.github/workflows/reusable-deploy.yml',
          with: { environment: 'production' },
          secrets: 'inherit',
        },
      },
    };
    const yaml = serializeWorkflow(wf).toString({ lineWidth: 0 });
    expect(yaml).toContain('uses: ./.github/workflows/reusable-deploy.yml');
    expect(yaml).toContain('secrets: inherit');
    expect(yaml).not.toContain('runs-on');
  });
});
