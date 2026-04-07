/**
 * `permissions` rule — validates the workflow- and job-level
 * `permissions` blocks against the closed schema of GitHub Actions
 * permission scopes and access levels.
 *
 * Accepted forms:
 *  - `'read-all'` / `'write-all'` (string shorthand)
 *  - `{}` (empty object — disables all scopes)
 *  - A partial map of `PermissionScope -> 'read' | 'write' | 'none'`
 */

import type { PermissionScope, PermissionValue, Workflow } from '../../schema/index.js';
import type { Rule, ValidationError } from '../errors.js';

const RULE = 'permissions';

const VALID_SCOPES: readonly PermissionScope[] = [
  'actions',
  'attestations',
  'checks',
  'contents',
  'deployments',
  'discussions',
  'id-token',
  'issues',
  'models',
  'packages',
  'pages',
  'pull-requests',
  'repository-projects',
  'security-events',
  'statuses',
] as const;

const VALID_VALUES: readonly PermissionValue[] = ['read', 'write', 'none'] as const;

const SCOPE_SET = new Set<string>(VALID_SCOPES);
const VALUE_SET = new Set<string>(VALID_VALUES);

function checkPermissions(
  permissions: unknown,
  basePath: (string | number)[],
  errors: ValidationError[],
): void {
  if (permissions === undefined || permissions === null) return;
  if (permissions === 'read-all' || permissions === 'write-all') return;
  if (typeof permissions !== 'object') return;

  for (const [scope, value] of Object.entries(permissions as Record<string, unknown>)) {
    if (!SCOPE_SET.has(scope)) {
      errors.push({
        path: [...basePath, scope],
        message: `Unknown permission scope '${scope}'`,
        severity: 'error',
        rule: RULE,
      });
      continue;
    }
    if (typeof value !== 'string' || !VALUE_SET.has(value)) {
      const display = typeof value === 'string' ? value : String(value);
      errors.push({
        path: [...basePath, scope],
        message: `Invalid permission value '${display}' for scope '${scope}' (expected 'read', 'write', or 'none')`,
        severity: 'error',
        rule: RULE,
      });
    }
  }
}

export const permissionsRule: Rule = (workflow: Workflow) => {
  const errors: ValidationError[] = [];

  checkPermissions(workflow.permissions, ['permissions'], errors);

  if (workflow.jobs && typeof workflow.jobs === 'object') {
    for (const [jobId, job] of Object.entries(workflow.jobs)) {
      const jobPermissions = (job as { permissions?: unknown }).permissions;
      checkPermissions(jobPermissions, ['jobs', jobId, 'permissions'], errors);
    }
  }

  return errors;
};
