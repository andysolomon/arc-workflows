import type { Workflow } from '../schema/index.js';

import { DEFAULT_OPTIONS, type GenerateOptions } from './options.js';
import { serializeWorkflow } from './serializer.js';

/**
 * Render a `Workflow` to a YAML string. Pure formatting — no disk I/O,
 * no validation. Feed the result to `writeWorkflow` or consume it
 * directly.
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
