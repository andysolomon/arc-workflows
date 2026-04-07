/**
 * Public surface of the validation pipeline.
 *
 * See `./validate.ts` for the runner and `./rules/` for the individual
 * rules.
 */

export type { Rule, ValidationError, ValidationResult, ValidationSeverity } from './errors.js';
export { formatPath } from './path.js';
export { validate } from './validate.js';
