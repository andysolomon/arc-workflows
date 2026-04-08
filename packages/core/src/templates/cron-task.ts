import type { Workflow } from '../schema/index.js';

import type { TemplateMetadata } from './types.js';

/**
 * Parameters for the `cron-task` template.
 */
export interface CronTaskParams {
  cron?: string;
  runner?: string;
}

/** @internal — use `listTemplates()` instead. */
export const cronTaskMetadata: TemplateMetadata = {
  id: 'cron-task',
  name: 'Scheduled Task',
  description: 'Run a job on a recurring cron schedule',
  tags: ['cron', 'schedule'],
};

/** @internal — use `getTemplate('cron-task')` instead. */
export function cronTask(params: CronTaskParams = {}): Workflow {
  const cron = params.cron ?? '0 0 * * *';
  const runner = params.runner ?? 'ubuntu-latest';

  return {
    name: 'Scheduled Task',
    on: {
      schedule: [{ cron }],
    },
    jobs: {
      run: {
        'runs-on': runner,
        steps: [
          { uses: 'actions/checkout@v4' },
          { run: 'echo "Scheduled task running at $(date)"' },
        ],
      },
    },
  };
}
