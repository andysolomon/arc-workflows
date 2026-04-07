import { describe, expectTypeOf, test } from 'vitest';

import type {
  PushConfig,
  PullRequestConfig,
  ScheduleConfig,
  Triggers,
  WorkflowDispatchInput,
} from './triggers.js';

describe('Triggers', () => {
  test('PushConfig accepts branch / tag / path filters', () => {
    const _push: PushConfig = {
      branches: ['main'],
      'branches-ignore': ['wip/**'],
      tags: ['v*'],
      'tags-ignore': ['v0.*'],
      paths: ['src/**'],
      'paths-ignore': ['**/*.md'],
    };
    void _push;
  });

  test('PullRequestConfig adds activity types on top of filters', () => {
    const _pr: PullRequestConfig = {
      branches: ['main'],
      types: ['opened', 'synchronize', 'reopened'],
    };
    void _pr;
  });

  test('ScheduleConfig requires a cron string', () => {
    const _schedule: ScheduleConfig[] = [{ cron: '0 0 * * *' }];
    void _schedule;
  });

  test('Triggers is the canonical object form', () => {
    const _on: Triggers = {
      push: { branches: ['main'] },
      pull_request: { types: ['opened'] },
      schedule: [{ cron: '0 0 * * *' }],
      workflow_dispatch: {
        inputs: {
          environment: {
            type: 'choice',
            options: ['staging', 'production'],
            default: 'staging',
          },
        },
      },
    };
    void _on;
  });

  test('WorkflowDispatchInput discriminates on `type`', () => {
    const choice: WorkflowDispatchInput = {
      type: 'choice',
      options: ['a', 'b'],
    };
    if (choice.type === 'choice') {
      expectTypeOf(choice.options).toEqualTypeOf<string[]>();
    }

    const number: WorkflowDispatchInput = { type: 'number', default: 42 };
    if (number.type === 'number') {
      expectTypeOf(number.default).toEqualTypeOf<number | undefined>();
    }
  });

  test('choice input requires options field', () => {
    // @ts-expect-error — choice inputs require `options`
    const _bad: WorkflowDispatchInput = {
      type: 'choice',
      default: 'a',
    };
    void _bad;
  });
});
