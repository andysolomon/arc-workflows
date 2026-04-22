/**
 * Helpers for the wizard's `${{ }}` expression autocomplete.
 *
 * The CLI shows a suggestion dropdown listing the 12 GitHub Actions
 * expression contexts whenever the user is inside an unfinished `${{`
 * group (i.e. a `${{` appears after the most recent `}}`). We expose
 * the trigger detection and filtering as pure functions so the
 * wizard pages stay focused on layout and callers can unit-test the
 * rules.
 */

export const EXPRESSION_CONTEXTS: readonly string[] = [
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
  'jobs',
] as const;

/**
 * Given a raw field value (e.g. `MY_VAR=${{ sec`), return the set of
 * expression contexts that start with the fragment following the
 * most recent unclosed `${{`. Returns an empty array when no unclosed
 * `${{` is found or no contexts match the fragment.
 */
export function matchExpressionContexts(rowValue: string): readonly string[] {
  const openIdx = rowValue.lastIndexOf('${{');
  if (openIdx === -1) return [];
  const closeIdx = rowValue.lastIndexOf('}}');
  if (closeIdx > openIdx) return [];
  const fragment = rowValue
    .slice(openIdx + '${{'.length)
    .trim()
    .toLowerCase();
  return EXPRESSION_CONTEXTS.filter((c) => c.startsWith(fragment));
}
