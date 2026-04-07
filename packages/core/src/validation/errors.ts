/**
 * Validation error types for the workflow validation pipeline.
 *
 * The pipeline is sync and collect-all: every rule is a pure function
 * that returns all errors it finds, and the runner concatenates them.
 */

import type { Workflow } from '../schema/index.js';

export type ValidationSeverity = 'error' | 'warning' | 'info';

/**
 * A single validation finding.
 *
 * `path` is a structured location (e.g. `['jobs', 'build', 'steps', 2,
 * 'uses']`) that callers can format via `formatPath()` for display or
 * use directly to locate the offending node in a YAML AST.
 */
export interface ValidationError {
  path: (string | number)[];
  message: string;
  severity: ValidationSeverity;
  rule: string;
}

/**
 * Result returned by `validate()`.
 *
 * `valid` is true iff there are no findings with severity `'error'`.
 * Warnings and infos do not make a workflow invalid.
 */
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

/**
 * A validation rule — a pure function from a workflow to a list of
 * findings. Rules MUST NOT throw; invalid inputs should be reported as
 * `ValidationError`s instead.
 */
export type Rule = (workflow: Workflow) => ValidationError[];
