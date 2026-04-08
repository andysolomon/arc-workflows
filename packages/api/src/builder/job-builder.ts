/**
 * Fluent builder for {@link NormalJob}.
 *
 * NOTE: This builder targets `NormalJob` (the steps-based form). Reusable
 * workflow call jobs (`ReusableJob` — invokes another workflow via
 * `uses`) are intentionally not covered in this PR. NormalJob covers the
 * vast majority of real-world workflows; a `ReusableJobBuilder` can be
 * added later without breaking the existing API.
 */

import type {
  Concurrency,
  Container,
  Defaults,
  Environment,
  NormalJob,
  Permissions,
  RunsOn,
  Service,
  Strategy,
} from '@arc-workflows/core';

import type { MatrixBuilder } from './matrix-builder.js';
import type { StepBuilder } from './step-builder.js';

/**
 * Fluent builder for a normal {@link NormalJob}.
 *
 * Construct via the {@link job} factory function.
 */
export class JobBuilder {
  private state: Partial<NormalJob> = { steps: [] };

  constructor(public readonly id: string) {}

  name(n: string): this {
    this.state.name = n;
    return this;
  }

  runsOn(r: RunsOn): this {
    this.state['runs-on'] = r;
    return this;
  }

  needs(deps: string | string[]): this {
    this.state.needs = deps;
    return this;
  }

  if(cond: string): this {
    this.state.if = cond;
    return this;
  }

  permissions(p: Permissions): this {
    this.state.permissions = p;
    return this;
  }

  environment(e: Environment): this {
    this.state.environment = e;
    return this;
  }

  concurrency(c: Concurrency): this {
    this.state.concurrency = c;
    return this;
  }

  env(e: Record<string, string | number | boolean>): this {
    this.state.env = e;
    return this;
  }

  defaults(d: Defaults): this {
    this.state.defaults = d;
    return this;
  }

  strategy(s: Strategy): this {
    this.state.strategy = s;
    return this;
  }

  /** Convenience: build a strategy from a {@link MatrixBuilder}. */
  matrix(builder: MatrixBuilder): this {
    this.state.strategy = builder.build();
    return this;
  }

  container(c: string | Container): this {
    this.state.container = c;
    return this;
  }

  services(s: Record<string, Service>): this {
    this.state.services = s;
    return this;
  }

  outputs(o: Record<string, string>): this {
    this.state.outputs = o;
    return this;
  }

  timeoutMinutes(n: number): this {
    this.state['timeout-minutes'] = n;
    return this;
  }

  continueOnError(b: boolean | string): this {
    this.state['continue-on-error'] = b;
    return this;
  }

  step(builder: StepBuilder): this {
    this.state.steps ??= [];
    this.state.steps.push(builder.build());
    return this;
  }

  /** @internal Used by {@link WorkflowBuilder.job}. */
  build(): NormalJob {
    if (!this.state['runs-on']) {
      throw new Error(`Job '${this.id}' requires runs-on`);
    }
    return this.state as NormalJob;
  }
}

/** Create a new {@link JobBuilder}. */
export function job(id: string): JobBuilder {
  return new JobBuilder(id);
}
