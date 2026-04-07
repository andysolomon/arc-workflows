/**
 * Core workflow types — `Workflow`, `Job`, `Step`, and supporting shapes.
 *
 * Reference: https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions
 *
 * Design notes:
 *
 *  - `Step` is a discriminated union of `ActionStep` (`uses`) and
 *    `RunStep` (`run`). The discriminator is *structural*: each variant
 *    declares the other's primary field as `never`. This mirrors the
 *    GitHub Actions YAML 1:1 (no synthetic `kind` field) and is narrowed
 *    via the `'uses' in step` / `'run' in step` `in` operator.
 *
 *  - The schema is **closed** — no index signature. New GitHub Actions
 *    spec fields ship as `feat:` updates to this file.
 *
 *  - String values may contain `${{ ... }}` expressions; the YAML
 *    generator detects them at output time. See `./expressions.ts`.
 */

import type { Permissions } from './permissions.js';
import type { RunsOn } from './runners.js';
import type { Triggers } from './triggers.js';

// ── shared shapes ──────────────────────────────────────────────────────

/**
 * Concurrency control for a workflow or job.
 *
 * A bare string is shorthand for `{ group: <string> }`.
 */
export type Concurrency =
  | string
  | {
      group: string;
      'cancel-in-progress'?: boolean | string;
    };

/**
 * Default `shell` and `working-directory` for `run` steps in a workflow
 * or job.
 */
export interface Defaults {
  run?: {
    shell?: string;
    'working-directory'?: string;
  };
}

/**
 * Container image config used by `Job.container` and entries of
 * `Job.services`.
 */
export interface Container {
  image: string;
  credentials?: {
    username: string;
    password: string;
  };
  env?: Record<string, string | number | boolean>;
  ports?: (string | number)[];
  volumes?: string[];
  options?: string;
}

/**
 * Service container — same shape as `Container`.
 */
export type Service = Container;

/**
 * Environment used by a job. May be a bare environment name or an
 * object with optional URL.
 */
export type Environment =
  | string
  | {
      name: string;
      url?: string;
    };

/**
 * Matrix strategy for a job. Dimension keys map to arrays of values
 * (or arbitrary structured values for `include`/`exclude` entries).
 */
export interface Matrix {
  include?: Record<string, unknown>[];
  exclude?: Record<string, unknown>[];
  [dimension: string]: unknown;
}

/**
 * Job execution strategy.
 */
export interface Strategy {
  matrix?: Matrix;
  'fail-fast'?: boolean;
  'max-parallel'?: number;
}

// ── steps ──────────────────────────────────────────────────────────────

export interface StepBase {
  id?: string;
  name?: string;
  if?: string;
  env?: Record<string, string | number | boolean>;
  'continue-on-error'?: boolean | string;
  'timeout-minutes'?: number;
  'working-directory'?: string;
}

/**
 * A step that invokes a reusable action via `uses`.
 *
 * Mutually exclusive with `RunStep` — `run` is forbidden.
 */
export interface ActionStep extends StepBase {
  uses: string;
  with?: Record<string, string | number | boolean>;
  run?: never;
  shell?: never;
}

/**
 * A step that executes shell commands via `run`.
 *
 * Mutually exclusive with `ActionStep` — `uses` is forbidden.
 */
export interface RunStep extends StepBase {
  run: string;
  shell?: string;
  uses?: never;
  with?: never;
}

/**
 * A workflow step. Either an `ActionStep` (with `uses`) or a `RunStep`
 * (with `run`). Narrow via the `in` operator: `if ('uses' in step) ...`.
 */
export type Step = ActionStep | RunStep;

// ── jobs ───────────────────────────────────────────────────────────────

/**
 * A workflow job.
 *
 * `runs-on` and `steps` are required for normal jobs. Reusable workflow
 * call jobs use `uses` instead and are modeled separately as
 * `ReusableJob`.
 */
export interface NormalJob {
  name?: string;
  'runs-on': RunsOn;
  needs?: string | string[];
  if?: string;
  permissions?: Permissions;
  environment?: Environment;
  concurrency?: Concurrency;
  outputs?: Record<string, string>;
  env?: Record<string, string | number | boolean>;
  defaults?: Defaults;
  strategy?: Strategy;
  container?: string | Container;
  services?: Record<string, Service>;
  steps: Step[];
  'timeout-minutes'?: number;
  'continue-on-error'?: boolean | string;
  uses?: never;
  with?: never;
  secrets?: never;
}

/**
 * A reusable workflow call job. Invokes another workflow file via
 * `uses` instead of running steps directly.
 */
export interface ReusableJob {
  name?: string;
  needs?: string | string[];
  if?: string;
  permissions?: Permissions;
  uses: string;
  with?: Record<string, string | number | boolean>;
  secrets?: 'inherit' | Record<string, string>;
  strategy?: Strategy;
  concurrency?: Concurrency;
  'runs-on'?: never;
  steps?: never;
}

/**
 * A workflow job — either a normal job (with `steps`) or a reusable
 * workflow call (with `uses`).
 */
export type Job = NormalJob | ReusableJob;

// ── workflow ───────────────────────────────────────────────────────────

/**
 * A complete GitHub Actions workflow.
 *
 * `on` and `jobs` are the only required fields. Everything else has a
 * GitHub-defined default.
 */
export interface Workflow {
  name?: string;
  'run-name'?: string;
  on: Triggers;
  permissions?: Permissions;
  env?: Record<string, string | number | boolean>;
  defaults?: Defaults;
  concurrency?: Concurrency;
  jobs: Record<string, Job>;
}
