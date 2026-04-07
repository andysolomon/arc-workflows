/// <reference types="node" />
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';

import type { Workflow } from '../schema/index.js';

import { generate } from './generate.js';
import type { GenerateOptions } from './options.js';

/**
 * Serialize `workflow` to YAML and write it to disk. When `filePath`
 * is omitted, the file is placed at `.github/workflows/<slug>.yml`
 * (slugged from `workflow.name`, or `workflow.yml` as a last resort).
 */
export async function writeWorkflow(
  workflow: Workflow,
  filePath?: string,
  options?: GenerateOptions,
): Promise<void> {
  const yaml = generate(workflow, options);
  const target = resolve(filePath ?? defaultPath(workflow));
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, yaml, 'utf8');
}

/**
 * Default output path for a workflow. Exposed for testing.
 */
export function defaultPath(workflow: Workflow): string {
  const slug = (workflow.name ?? 'workflow')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return join('.github', 'workflows', `${slug || 'workflow'}.yml`);
}
