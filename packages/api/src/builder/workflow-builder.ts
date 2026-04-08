/**
 * Fluent builder for {@link Workflow}.
 *
 * Construct via the {@link workflow} factory rather than instantiating
 * the class directly.
 */

import {
  generate,
  validate,
  writeWorkflow,
  type Concurrency,
  type Defaults,
  type GenerateOptions,
  type Permissions,
  type Triggers,
  type ValidationResult,
  type Workflow,
} from '@arc-workflows/core';

import type { JobBuilder } from './job-builder.js';

/**
 * Fluent builder for a {@link Workflow}.
 *
 * Construct via the {@link workflow} factory function rather than calling
 * the constructor directly.
 *
 * @example
 * ```ts
 * import { workflow, job, step } from '@arc-workflows/api';
 *
 * const ci = workflow('CI')
 *   .on('pull_request', { branches: ['main'] })
 *   .job(job('build').runsOn('ubuntu-latest').step(step().run('npm test')));
 *
 * console.log(ci.toYAML());
 * ```
 */
export class WorkflowBuilder {
  private state: Partial<Workflow> = { jobs: {} };

  constructor(name?: string) {
    if (name !== undefined) this.state.name = name;
  }

  /**
   * Add or override a workflow trigger event. Pass `undefined` to use
   * the bare trigger form (e.g. `on: { workflow_dispatch: null }`).
   */
  on<K extends keyof Triggers>(eventName: K, config?: Triggers[K]): this {
    this.state.on ??= {};
    const triggers = this.state.on as Record<string, unknown>;
    triggers[eventName as string] = config ?? null;
    return this;
  }

  permissions(p: Permissions): this {
    this.state.permissions = p;
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

  concurrency(c: Concurrency): this {
    this.state.concurrency = c;
    return this;
  }

  runName(name: string): this {
    this.state['run-name'] = name;
    return this;
  }

  job(builder: JobBuilder): this {
    this.state.jobs ??= {};
    this.state.jobs[builder.id] = builder.build();
    return this;
  }

  /** Get the underlying {@link Workflow} object. */
  toJSON(): Workflow {
    if (!this.state.on) {
      throw new Error('Workflow requires at least one trigger via .on()');
    }
    if (!this.state.jobs || Object.keys(this.state.jobs).length === 0) {
      throw new Error('Workflow requires at least one job via .job()');
    }
    return this.state as Workflow;
  }

  /** Generate YAML from the workflow. Pure formatting — does not validate. */
  toYAML(options?: GenerateOptions): string {
    return generate(this.toJSON(), options);
  }

  /** Run the validation pipeline on this workflow. */
  validate(): ValidationResult {
    return validate(this.toJSON());
  }

  /** Generate YAML and write it to disk. Defaults to `.github/workflows/<slug>.yml`. */
  async writeTo(filePath?: string): Promise<void> {
    await writeWorkflow(this.toJSON(), filePath);
  }
}

/**
 * Create a new {@link WorkflowBuilder}.
 *
 * @param name optional workflow name
 */
export function workflow(name?: string): WorkflowBuilder {
  return new WorkflowBuilder(name);
}
