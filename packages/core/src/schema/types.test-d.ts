import { describe, expectTypeOf, test } from 'vitest';

import type { ActionStep, Job, RunStep, Step, Workflow } from './types.js';

describe('Workflow / Job / Step types', () => {
  test('Workflow requires `on` and `jobs`', () => {
    // @ts-expect-error — `on` is required
    const _missingOn: Workflow = { jobs: {} };
    // @ts-expect-error — `jobs` is required
    const _missingJobs: Workflow = { on: { push: {} } };
    void _missingOn;
    void _missingJobs;

    const _ok: Workflow = {
      name: 'CI',
      on: { push: { branches: ['main'] } },
      jobs: {},
    };
    void _ok;
  });

  test('NormalJob requires `runs-on` and `steps`', () => {
    // @ts-expect-error — runs-on missing
    const _missingRunsOn: Job = { steps: [] };
    // @ts-expect-error — steps missing
    const _missingSteps: Job = { 'runs-on': 'ubuntu-latest' };
    void _missingRunsOn;
    void _missingSteps;
  });

  test('ActionStep rejects `run`', () => {
    const _bad: ActionStep = {
      uses: 'actions/checkout@v4',
      // @ts-expect-error — run is `never` on ActionStep
      run: 'echo hi',
    };
    void _bad;
  });

  test('RunStep rejects `uses`', () => {
    const _bad: RunStep = {
      run: 'echo hi',
      // @ts-expect-error — uses is `never` on RunStep
      uses: 'actions/checkout@v4',
    };
    void _bad;
  });

  test('Step variants are distinguishable via the discriminator field', () => {
    const action = { uses: 'actions/checkout@v4' } satisfies Step;
    const run = { run: 'echo hi' } satisfies Step;
    expectTypeOf(action).toMatchTypeOf<ActionStep>();
    expectTypeOf(run).toMatchTypeOf<RunStep>();
  });

  test('truthy step.uses narrows to a string-typed `uses`', () => {
    function check(step: Step): void {
      if (step.uses) {
        expectTypeOf(step.uses).toEqualTypeOf<string>();
      }
    }
    void check;
  });

  test('a complete sample workflow compiles', () => {
    const _wf: Workflow = {
      name: 'CI',
      on: {
        push: { branches: ['main'] },
        pull_request: { branches: ['main'] },
      },
      permissions: { contents: 'read' },
      jobs: {
        build: {
          'runs-on': 'ubuntu-latest',
          steps: [
            { uses: 'actions/checkout@v4' },
            {
              uses: 'actions/setup-node@v4',
              with: { 'node-version': '20' },
            },
            { run: 'npm ci' },
            { run: 'npm test' },
          ],
        },
      },
    };
    void _wf;
  });

  test('reusable workflow call job is accepted', () => {
    const _wf: Workflow = {
      on: { push: {} },
      jobs: {
        deploy: {
          uses: './.github/workflows/reusable-deploy.yml',
          with: { environment: 'production' },
          secrets: 'inherit',
        },
      },
    };
    void _wf;
  });
});
