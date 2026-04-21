import type { Triggers } from '../schema/index.js';

/**
 * Normalize the `on:` field from GitHub Actions shorthand forms
 * to the canonical object form expected by the {@link Triggers} type.
 *
 * Handles:
 *  - `on: push` (bare string) → `{ push: {} }`
 *  - `on: [push, pull_request]` (array of strings) → `{ push: {}, pull_request: {} }`
 *  - `on: { push: { branches: [main] } }` (canonical) → pass through
 *  - `on: null` / `on: undefined` → empty object `{}`
 */
export function normalizeTriggers(raw: unknown): Triggers {
  // null / undefined → empty
  if (raw === null || raw === undefined) {
    return {};
  }

  // Bare string: "push" → { push: {} }
  if (typeof raw === 'string') {
    return { [raw]: {} } as Triggers;
  }

  // Array of strings: ["push", "pull_request"] → { push: {}, pull_request: {} }
  if (Array.isArray(raw)) {
    const result: Record<string, unknown> = {};
    for (const item of raw) {
      if (typeof item === 'string') {
        result[item] = {};
      }
    }
    return result as Triggers;
  }

  // Object: pass through (already canonical)
  if (typeof raw === 'object') {
    return raw as Triggers;
  }

  // Anything else: treat as empty
  return {};
}
