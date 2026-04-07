/**
 * `expressions` rule — recursively walks every string leaf in a workflow,
 * extracts `${{ ... }}` substrings, and warns when the leading namespace
 * identifier is not one of the documented GitHub Actions contexts.
 *
 * This is a deliberately shallow check: we only validate the namespace
 * (e.g. `secrets` vs `secret`, the most common typo). Full expression
 * parsing is out of scope.
 */

import type { Workflow } from '../../schema/index.js';
import type { Rule, ValidationError } from '../errors.js';

const RULE = 'expressions';

const ALLOWED_NAMESPACES = new Set([
  'github',
  'secrets',
  'env',
  'matrix',
  'steps',
  'needs',
  'inputs',
  'vars',
  'runner',
  'job',
  'strategy',
]);

const ALLOWED_LIST = [
  'github',
  'secrets',
  'env',
  'matrix',
  'steps',
  'needs',
  'inputs',
  'vars',
  'runner',
  'job',
  'strategy',
].join(', ');

const EXPRESSION_PATTERN = /\$\{\{([\s\S]*?)\}\}/g;
const NAMESPACE_PATTERN = /^\s*([A-Za-z_][A-Za-z0-9_-]*)/;

function checkString(value: string, path: (string | number)[], errors: ValidationError[]): void {
  EXPRESSION_PATTERN.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = EXPRESSION_PATTERN.exec(value)) !== null) {
    const inner = match[1] ?? '';
    const nsMatch = NAMESPACE_PATTERN.exec(inner);
    if (!nsMatch) continue;
    const ns = nsMatch[1] ?? '';
    if (!ALLOWED_NAMESPACES.has(ns)) {
      errors.push({
        path,
        message: `Unknown expression context '${ns}'; expected one of: ${ALLOWED_LIST}`,
        severity: 'warning',
        rule: RULE,
      });
    }
  }
}

function walkStrings(
  value: unknown,
  currentPath: (string | number)[],
  callback: (path: (string | number)[], value: string) => void,
): void {
  if (typeof value === 'string') {
    callback(currentPath, value);
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item, i) => {
      walkStrings(item, [...currentPath, i], callback);
    });
    return;
  }
  if (value !== null && typeof value === 'object') {
    for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
      walkStrings(child, [...currentPath, key], callback);
    }
  }
}

export const expressionsRule: Rule = (workflow: Workflow) => {
  const errors: ValidationError[] = [];
  walkStrings(workflow, [], (path, value) => {
    checkString(value, path, errors);
  });
  return errors;
};
