/**
 * Canonical key orderings for workflow/job/step YAML output.
 *
 * These arrays drive a deterministic emit order so generated YAML is
 * stable across runs and diff-friendly. Keys not listed here are
 * dropped by `buildMapInOrder`; when the GitHub Actions schema grows,
 * add the new keys here.
 */

export const WORKFLOW_KEYS = [
  'name',
  'run-name',
  'on',
  'permissions',
  'env',
  'defaults',
  'concurrency',
  'jobs',
] as const;

export const NORMAL_JOB_KEYS = [
  'name',
  'runs-on',
  'needs',
  'if',
  'permissions',
  'environment',
  'concurrency',
  'env',
  'defaults',
  'strategy',
  'container',
  'services',
  'outputs',
  'steps',
  'timeout-minutes',
  'continue-on-error',
] as const;

export const REUSABLE_JOB_KEYS = [
  'name',
  'needs',
  'if',
  'permissions',
  'uses',
  'with',
  'secrets',
  'strategy',
  'concurrency',
] as const;

export const ACTION_STEP_KEYS = [
  'name',
  'id',
  'if',
  'uses',
  'with',
  'env',
  'continue-on-error',
  'timeout-minutes',
  'working-directory',
] as const;

export const RUN_STEP_KEYS = [
  'name',
  'id',
  'if',
  'run',
  'shell',
  'env',
  'working-directory',
  'continue-on-error',
  'timeout-minutes',
] as const;
