import { parse as parseYaml } from 'yaml';
import type { Workflow } from '../schema/index.js';
import { normalizeTriggers } from './normalizer.js';
import { ParseError } from './errors.js';

/**
 * Parse a GitHub Actions workflow YAML string into a typed
 * {@link Workflow} object.
 *
 * Normalizes shorthand trigger forms (`on: push`, `on: [push, pr]`)
 * to the canonical object form. All other polymorphisms (`needs`,
 * `runs-on`, `permissions`, `concurrency`) pass through as-is since
 * the schema accepts them natively.
 *
 * @throws {ParseError} on invalid YAML syntax or non-object top-level structure
 *
 * **Semantic validation is NOT performed.** Call `validate()` on the
 * returned object for that.
 *
 * @example
 * ```ts
 * import { parse, validate } from '@arc-workflows/core';
 *
 * const wf = parse(yamlString);    // throws ParseError on syntax error
 * const result = validate(wf);      // semantic validation
 * if (!result.valid) { ... }
 * ```
 */
export function parse(yamlString: string): Workflow {
  let raw: unknown;
  try {
    raw = parseYaml(yamlString);
  } catch (err) {
    throw new ParseError(
      `Invalid YAML syntax: ${err instanceof Error ? err.message : String(err)}`,
      yamlString,
      { cause: err },
    );
  }

  if (raw === null || raw === undefined || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new ParseError('Workflow YAML must be a mapping (object) at the top level', yamlString);
  }

  const obj = raw as Record<string, unknown>;

  // Normalize trigger shorthand forms
  if ('on' in obj) {
    obj.on = normalizeTriggers(obj.on);
  }

  return obj as unknown as Workflow;
}
