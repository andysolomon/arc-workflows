/**
 * `cron` rule — validates the cron expression of every `on.schedule[*]`
 * entry by parsing it with `cron-parser`.
 *
 * GitHub Actions uses POSIX 5-field cron syntax (minute, hour, day-of-month,
 * month, day-of-week) so any parser failure indicates a real problem the
 * user should fix before committing the workflow.
 */

import cronParser from 'cron-parser';

const { parseExpression } = cronParser;

import type { Workflow } from '../../schema/index.js';
import type { Rule, ValidationError } from '../errors.js';

const RULE = 'cron';

export const cronRule: Rule = (workflow: Workflow) => {
  const errors: ValidationError[] = [];
  const schedules = workflow.on?.schedule ?? [];

  schedules.forEach((entry, index) => {
    if (!entry || typeof entry !== 'object' || typeof entry.cron !== 'string') {
      return;
    }

    try {
      parseExpression(entry.cron);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      errors.push({
        path: ['on', 'schedule', index, 'cron'],
        message: `Invalid cron expression: ${message}`,
        severity: 'error',
        rule: RULE,
      });
    }
  });

  return errors;
};
