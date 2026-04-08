/**
 * Types for the user-supplied `.arc-workflows` config file.
 *
 * The config file lets users set project-wide defaults (runner, branch,
 * language versions) and per-template overrides so they don't have to
 * repeat themselves every time they generate a workflow.
 */

import type { Runner } from '../schema/runners.js';
import type { Step } from '../schema/types.js';
import type { TemplateId } from '../templates/types.js';

export interface ArcConfig {
  /** Default runner label for new workflows. e.g. 'ubuntu-24.04' */
  defaultRunner?: Runner;
  /** Default branch name for trigger filters. e.g. 'main' */
  defaultBranch?: string;
  /** Default Node.js version for templates that use it */
  nodeVersion?: string;
  /** Default Python version for templates that use it */
  pythonVersion?: string;
  /** Default package manager for ci-node */
  packageManager?: 'npm' | 'pnpm' | 'yarn';
  /** Steps that should always be present in any new workflow's first job */
  requiredSteps?: Step[];
  /** Per-template parameter overrides */
  templates?: Partial<Record<TemplateId, Record<string, unknown>>>;
}

export interface LoadConfigResult {
  /** Loaded config, or empty object if no file was found */
  config: ArcConfig;
  /** Absolute path of the loaded config file, or null if none was found */
  source: string | null;
}

export interface LoadConfigOptions {
  /** Directory to start the search from. Defaults to process.cwd() */
  cwd?: string;
}
