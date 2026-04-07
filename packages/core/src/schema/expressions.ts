/**
 * GitHub Actions expressions are template strings of the form `${{ ... }}`
 * that get evaluated by the Actions runner. Examples:
 *
 *   ${{ secrets.DEPLOY_TOKEN }}
 *   ${{ github.event_name == 'push' }}
 *   ${{ matrix.node-version }}
 *
 * In our schema we represent these as plain strings, with two affordances:
 *
 *  1. **`Expression<T>` brand type** — a TypeScript-only marker that lets
 *     callers express intent ("this string is an expression that resolves
 *     to a T"). It is *not* a class or symbol, so it survives `JSON.stringify`
 *     and `structuredClone` losslessly.
 *
 *  2. **`isExpressionString()` runtime detector** — a regex check used by
 *     the YAML generator to decide whether to emit a string as a plain
 *     scalar (no quoting) or a quoted scalar.
 *
 * Both are zero-cost: the brand has no runtime representation, and the
 * detector is a single regex test.
 */

declare const expressionBrand: unique symbol;

/**
 * A string known to contain (or be) a GitHub Actions expression.
 *
 * The phantom type parameter `T` describes the value the expression
 * evaluates to at runtime — it is purely advisory and never enforced.
 */
export type Expression<T = unknown> = string & {
  readonly [expressionBrand]: T;
};

/**
 * Tag a string as an `Expression<T>`. This is a no-op at runtime — the
 * input string is returned as-is. The cast exists only so the type
 * system can track that this string is meant to be an expression.
 *
 * @example
 * const token = expr<string>('${{ secrets.DEPLOY_TOKEN }}');
 * const node: Job = { 'runs-on': 'ubuntu-latest', steps: [{ run: token }] };
 */
export function expr<T = unknown>(template: string): Expression<T> {
  return template as Expression<T>;
}

/**
 * Detect whether a string contains a GitHub Actions expression.
 *
 * Used by the YAML generator to decide between quoted and plain scalars.
 * The regex matches `${{ ... }}` non-greedily and tolerates multi-line
 * expressions.
 */
const EXPRESSION_PATTERN = /\$\{\{[\s\S]*?\}\}/;

export function isExpressionString(value: string): boolean {
  return EXPRESSION_PATTERN.test(value);
}
