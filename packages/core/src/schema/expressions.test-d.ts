import { describe, expectTypeOf, test } from 'vitest';

import type { Expression } from './expressions.js';
import { expr, isExpressionString } from './expressions.js';

describe('Expression brand type', () => {
  test('Expression<T> is assignable to string', () => {
    const e = expr<string>('${{ secrets.X }}');
    expectTypeOf(e).toMatchTypeOf<string>();
  });

  test('expr() returns Expression<T> with the requested type parameter', () => {
    expectTypeOf(expr<string>('${{ x }}')).toEqualTypeOf<Expression<string>>();
    expectTypeOf(expr<number>('${{ x }}')).toEqualTypeOf<Expression<number>>();
    expectTypeOf(expr('${{ x }}')).toEqualTypeOf<Expression<unknown>>();
  });

  test('plain string is NOT assignable to Expression (without expr())', () => {
    // @ts-expect-error — plain strings are not branded
    const _bad: Expression<string> = '${{ x }}';
    void _bad;
  });

  test('isExpressionString has the right signature', () => {
    expectTypeOf(isExpressionString).toEqualTypeOf<(value: string) => boolean>();
  });
});
