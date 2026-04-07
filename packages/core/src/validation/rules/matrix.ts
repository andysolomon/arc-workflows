/**
 * `matrix` rule — flags empty dimensions in a job's `strategy.matrix`.
 *
 * GitHub Actions silently expands a matrix with an empty dimension to
 * zero job runs, which is almost always a bug. We skip the special
 * `include` / `exclude` keys (different semantics, stretch goals).
 */

import type { Workflow } from '../../schema/index.js';
import type { Rule, ValidationError } from '../errors.js';

const RULE = 'matrix';

export const matrixRule: Rule = (workflow: Workflow) => {
  const errors: ValidationError[] = [];

  if (workflow.jobs === undefined || workflow.jobs === null) {
    return errors;
  }

  for (const [jobId, job] of Object.entries(workflow.jobs)) {
    // Skip ReusableJob — it has `uses` instead of `runs-on`.
    if (!('runs-on' in job) || job['runs-on'] === undefined) continue;

    const strategy = job.strategy;
    if (!strategy || typeof strategy !== 'object') continue;

    const matrix = strategy.matrix;
    if (!matrix || typeof matrix !== 'object') continue;

    for (const [key, value] of Object.entries(matrix)) {
      if (key === 'include' || key === 'exclude') continue;
      if (Array.isArray(value) && value.length === 0) {
        errors.push({
          path: ['jobs', jobId, 'strategy', 'matrix', key],
          message: `Matrix dimension '${key}' is empty`,
          severity: 'error',
          rule: RULE,
        });
      }
    }
  }

  return errors;
};
