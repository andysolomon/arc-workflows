import { Scalar } from 'yaml';

import { isExpressionString } from '../schema/expressions.js';

/**
 * True if a string contains an embedded newline and should be emitted
 * as a YAML block literal (`|`) rather than a plain or quoted scalar.
 */
export function needsLiteralBlock(value: string): boolean {
  return value.includes('\n');
}

/**
 * Apply the appropriate YAML scalar style to a string node based on
 * its content. Expressions stay PLAIN (unquoted) so the Actions runner
 * sees the raw `${{ ... }}` template; multi-line strings use
 * BLOCK_LITERAL (`|`) so shell scripts stay readable; everything else
 * lets eemeli/yaml decide.
 */
export function applyScalarStyle(node: Scalar, value: string): void {
  if (isExpressionString(value)) {
    node.type = Scalar.PLAIN;
    return;
  }
  if (needsLiteralBlock(value)) {
    node.type = Scalar.BLOCK_LITERAL;
  }
  // else leave default — yaml lib picks based on content
}

export { isExpressionString };
