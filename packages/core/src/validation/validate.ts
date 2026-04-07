/**
 * The validation pipeline runner.
 *
 * Calls every rule in order, concatenates their findings, and returns
 * a single `ValidationResult`. The pipeline is deliberately sync and
 * collect-all (no short-circuiting) so callers see every problem in a
 * workflow in one pass.
 */

import type { Workflow } from '../schema/index.js';
import type { Rule, ValidationError, ValidationResult } from './errors.js';
import { actionRefsRule } from './rules/action-refs.js';
import { cronRule } from './rules/cron.js';
import { expressionsRule } from './rules/expressions.js';
import { jobDepsRule } from './rules/job-deps.js';
import { matrixRule } from './rules/matrix.js';
import { permissionsRule } from './rules/permissions.js';
import { requiredFieldsRule } from './rules/required-fields.js';
import { runnersRule } from './rules/runners.js';

const RULES: Rule[] = [
  requiredFieldsRule,
  actionRefsRule,
  jobDepsRule,
  cronRule,
  matrixRule,
  permissionsRule,
  expressionsRule,
  runnersRule,
];

export function validate(workflow: Workflow): ValidationResult {
  const errors: ValidationError[] = [];
  for (const rule of RULES) {
    errors.push(...rule(workflow));
  }
  return {
    valid: errors.every((e) => e.severity !== 'error'),
    errors,
  };
}
