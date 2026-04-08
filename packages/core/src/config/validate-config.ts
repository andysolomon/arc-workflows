/**
 * Type-checks an `unknown` value against the `ArcConfig` shape.
 *
 * Errors use the same `ValidationError` shape as the workflow validation
 * pipeline so callers can format both kinds of findings the same way.
 * Unknown top-level keys are reported as warnings (not errors) for
 * forward-compatibility with future config additions.
 */

import type { ValidationError } from '../validation/errors.js';

const VALID_TOP_LEVEL_KEYS = new Set([
  'defaultRunner',
  'defaultBranch',
  'nodeVersion',
  'pythonVersion',
  'packageManager',
  'requiredSteps',
  'templates',
]);

const VALID_PACKAGE_MANAGERS = new Set(['npm', 'pnpm', 'yarn']);

export interface ValidateConfigResult {
  valid: boolean;
  errors: ValidationError[];
}

export function validateConfig(value: unknown): ValidateConfigResult {
  const errors: ValidationError[] = [];

  if (value === null || value === undefined) {
    // empty config is valid
    return { valid: true, errors };
  }
  if (typeof value !== 'object' || Array.isArray(value)) {
    errors.push({
      path: [],
      message: 'Config must be an object',
      severity: 'error',
      rule: 'config-shape',
    });
    return { valid: false, errors };
  }

  const config = value as Record<string, unknown>;

  // Unknown keys → warning (forward-compat)
  for (const key of Object.keys(config)) {
    if (!VALID_TOP_LEVEL_KEYS.has(key)) {
      errors.push({
        path: [key],
        message: `Unknown config key '${key}'; expected one of: ${Array.from(VALID_TOP_LEVEL_KEYS).join(', ')}`,
        severity: 'warning',
        rule: 'config-unknown-key',
      });
    }
  }

  // Type checks on known keys
  if ('defaultRunner' in config && typeof config.defaultRunner !== 'string') {
    errors.push({
      path: ['defaultRunner'],
      message: 'defaultRunner must be a string',
      severity: 'error',
      rule: 'config-type',
    });
  }
  if ('defaultBranch' in config && typeof config.defaultBranch !== 'string') {
    errors.push({
      path: ['defaultBranch'],
      message: 'defaultBranch must be a string',
      severity: 'error',
      rule: 'config-type',
    });
  }
  if ('nodeVersion' in config && typeof config.nodeVersion !== 'string') {
    errors.push({
      path: ['nodeVersion'],
      message: 'nodeVersion must be a string',
      severity: 'error',
      rule: 'config-type',
    });
  }
  if ('pythonVersion' in config && typeof config.pythonVersion !== 'string') {
    errors.push({
      path: ['pythonVersion'],
      message: 'pythonVersion must be a string',
      severity: 'error',
      rule: 'config-type',
    });
  }
  if ('packageManager' in config) {
    if (
      typeof config.packageManager !== 'string' ||
      !VALID_PACKAGE_MANAGERS.has(config.packageManager)
    ) {
      errors.push({
        path: ['packageManager'],
        message: `packageManager must be 'npm', 'pnpm', or 'yarn'`,
        severity: 'error',
        rule: 'config-type',
      });
    }
  }
  if ('requiredSteps' in config && !Array.isArray(config.requiredSteps)) {
    errors.push({
      path: ['requiredSteps'],
      message: 'requiredSteps must be an array',
      severity: 'error',
      rule: 'config-type',
    });
  }
  if ('templates' in config) {
    if (
      typeof config.templates !== 'object' ||
      config.templates === null ||
      Array.isArray(config.templates)
    ) {
      errors.push({
        path: ['templates'],
        message: 'templates must be an object',
        severity: 'error',
        rule: 'config-type',
      });
    }
  }

  const valid = errors.every((e) => e.severity !== 'error');
  return { valid, errors };
}
