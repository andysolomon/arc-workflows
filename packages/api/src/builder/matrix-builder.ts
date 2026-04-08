/**
 * Fluent builder for a job matrix {@link Strategy}.
 */

import type { Matrix, Strategy } from '@arc-workflows/core';

/**
 * Fluent builder for a matrix {@link Strategy}.
 *
 * Construct via the {@link matrix} factory function.
 */
export class MatrixBuilder {
  private _matrix: Matrix = {};
  private _strategy: { 'fail-fast'?: boolean; 'max-parallel'?: number } = {};

  /** Add a matrix dimension (e.g. `dimension('node-version', [18, 20])`). */
  dimension(name: string, values: unknown[]): this {
    this._matrix[name] = values;
    return this;
  }

  /** Append an `include` entry to the matrix. */
  include(entry: Record<string, unknown>): this {
    this._matrix.include ??= [];
    this._matrix.include.push(entry);
    return this;
  }

  /** Append an `exclude` entry to the matrix. */
  exclude(entry: Record<string, unknown>): this {
    this._matrix.exclude ??= [];
    this._matrix.exclude.push(entry);
    return this;
  }

  failFast(b: boolean): this {
    this._strategy['fail-fast'] = b;
    return this;
  }

  maxParallel(n: number): this {
    this._strategy['max-parallel'] = n;
    return this;
  }

  /** @internal Used by {@link JobBuilder.matrix}. */
  build(): Strategy {
    return { ...this._strategy, matrix: this._matrix };
  }
}

/** Create a new {@link MatrixBuilder}. */
export function matrix(): MatrixBuilder {
  return new MatrixBuilder();
}
