/**
 * Fluent builder for {@link Step}.
 *
 * Steps are a discriminated union of `ActionStep` (with `uses`) and
 * `RunStep` (with `run`). The two are mutually exclusive in the schema,
 * so we track an internal `_kind` and throw at runtime if the caller
 * mixes the two.
 */

import type { ActionStep, RunStep, Step } from '@arc-workflows/core';

type StepKind = 'pending' | 'action' | 'run';

interface MutableStepState {
  id?: string;
  name?: string;
  if?: string;
  env?: Record<string, string | number | boolean>;
  'continue-on-error'?: boolean | string;
  'timeout-minutes'?: number;
  'working-directory'?: string;
  uses?: string;
  with?: Record<string, string | number | boolean>;
  run?: string;
  shell?: string;
}

/**
 * Fluent builder for a workflow {@link Step}.
 *
 * A step is either an `ActionStep` (built with `.uses()`) or a `RunStep`
 * (built with `.run()`). The two are mutually exclusive: calling both
 * throws.
 */
export class StepBuilder {
  private _kind: StepKind = 'pending';
  private state: MutableStepState = {};

  name(n: string): this {
    this.state.name = n;
    return this;
  }

  id(s: string): this {
    this.state.id = s;
    return this;
  }

  if(cond: string): this {
    this.state.if = cond;
    return this;
  }

  env(e: Record<string, string | number | boolean>): this {
    this.state.env = e;
    return this;
  }

  continueOnError(b: boolean | string): this {
    this.state['continue-on-error'] = b;
    return this;
  }

  timeoutMinutes(n: number): this {
    this.state['timeout-minutes'] = n;
    return this;
  }

  workingDirectory(d: string): this {
    this.state['working-directory'] = d;
    return this;
  }

  uses(actionRef: string): this {
    if (this._kind === 'run') {
      throw new Error(
        'Cannot call .uses() after .run() — a step is either an action or a run, not both',
      );
    }
    this._kind = 'action';
    this.state.uses = actionRef;
    return this;
  }

  with(inputs: Record<string, string | number | boolean>): this {
    if (this._kind === 'run') {
      throw new Error('Cannot call .with() on a run step');
    }
    this.state.with = inputs;
    return this;
  }

  run(cmd: string): this {
    if (this._kind === 'action') {
      throw new Error(
        'Cannot call .run() after .uses() — a step is either an action or a run, not both',
      );
    }
    this._kind = 'run';
    this.state.run = cmd;
    return this;
  }

  shell(s: string): this {
    if (this._kind === 'action') {
      throw new Error('Cannot call .shell() on an action step');
    }
    this.state.shell = s;
    return this;
  }

  /** @internal Used by {@link JobBuilder.step}. */
  build(): Step {
    if (this._kind === 'pending') {
      throw new Error('Step must have either .uses() or .run() called');
    }
    if (this._kind === 'action') {
      return this.state as unknown as ActionStep;
    }
    return this.state as unknown as RunStep;
  }
}

/** Create a new {@link StepBuilder}. */
export function step(): StepBuilder {
  return new StepBuilder();
}
