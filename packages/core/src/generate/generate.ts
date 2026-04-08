import type { Workflow } from '../schema/index.js';

import { DEFAULT_OPTIONS, type GenerateOptions } from './options.js';
import { serializeWorkflow } from './serializer.js';

/**
 * Generate a YAML string from a `Workflow` object.
 *
 * The output is suitable for committing to `.github/workflows/`. Key
 * ordering matches the canonical GitHub Actions style:
 * `name → run-name → on → permissions → env → defaults → concurrency → jobs`.
 * Expressions like `${{ secrets.X }}` are emitted unquoted. Multi-line
 * `run` strings are emitted as YAML literal blocks (`|`). The function
 * is pure formatting — no disk I/O, no validation. Feed the result to
 * `writeWorkflow` or consume it directly.
 *
 * @example
 * ```ts
 * import { generate, type Workflow } from '@arc-workflows/core';
 *
 * const wf: Workflow = {
 *   name: 'CI',
 *   on: { push: { branches: ['main'] } },
 *   jobs: {
 *     build: {
 *       'runs-on': 'ubuntu-latest',
 *       steps: [{ uses: 'actions/checkout@v4' }],
 *     },
 *   },
 * };
 *
 * console.log(generate(wf));
 * ```
 */
export function generate(workflow: Workflow, options?: GenerateOptions): string {
  const merged = { ...DEFAULT_OPTIONS, ...options };
  const doc = serializeWorkflow(workflow);
  let yaml = doc.toString({
    lineWidth: merged.lineWidth,
    indent: merged.indent,
    doubleQuotedAsJSON: false,
  });
  if (merged.header) {
    const headerComment = merged.header
      .split('\n')
      .map((line) => `# ${line}`)
      .join('\n');
    yaml = `${headerComment}\n${yaml}`;
  }
  return yaml;
}
