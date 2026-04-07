/**
 * GitHub Actions workflow and job permissions.
 *
 * Reference: https://docs.github.com/en/actions/using-jobs/assigning-permissions-to-jobs
 *
 * Permissions can be specified in three forms:
 *
 *  1. A shorthand string `'read-all'` or `'write-all'` that applies the
 *     same level to every scope.
 *  2. An empty object `{}` which sets every scope to `'none'`.
 *  3. An object that maps individual scopes to `'read'`, `'write'`, or
 *     `'none'`. Unspecified scopes inherit the workflow default.
 *
 * The schema is closed: we ship a `feat:` update when GitHub adds a new
 * permission scope. As of 2026-04 there are 15 documented scopes.
 */

export type PermissionScope =
  | 'actions'
  | 'attestations'
  | 'checks'
  | 'contents'
  | 'deployments'
  | 'discussions'
  | 'id-token'
  | 'issues'
  | 'models'
  | 'packages'
  | 'pages'
  | 'pull-requests'
  | 'repository-projects'
  | 'security-events'
  | 'statuses';

export type PermissionValue = 'read' | 'write' | 'none';

/**
 * Workflow- or job-level permissions.
 *
 * - `'read-all'` / `'write-all'` apply the level to every scope.
 * - `{}` (empty object) disables all scopes.
 * - A partial map sets individual scopes; unspecified scopes inherit
 *   the workflow default.
 */
export type Permissions =
  | 'read-all'
  | 'write-all'
  | Record<string, never>
  | Partial<Record<PermissionScope, PermissionValue>>;
