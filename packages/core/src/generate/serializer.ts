/**
 * Workflow → `yaml.Document` serializer.
 *
 * Walks a `Workflow` object and builds a hand-constructed AST of
 * eemeli/yaml nodes (`YAMLMap`, `YAMLSeq`, `Scalar`) so we can control
 * key order and per-scalar style. The resulting `Document` is handed
 * to `generate.ts` for stringification.
 */

import { Document, Scalar, YAMLMap, YAMLSeq } from 'yaml';

import type { Job, Step, Workflow } from '../schema/index.js';

import { applyScalarStyle } from './formatters.js';
import {
  ACTION_STEP_KEYS,
  NORMAL_JOB_KEYS,
  REUSABLE_JOB_KEYS,
  RUN_STEP_KEYS,
  WORKFLOW_KEYS,
} from './key-order.js';

/**
 * Build a `yaml.Document` AST from a `Workflow` object.
 *
 * Internal serializer detail used by `generate()`. Consumers should
 * call `generate()` instead of constructing the document directly.
 *
 * @internal
 */
export function serializeWorkflow(workflow: Workflow): Document {
  const doc = new Document();
  doc.contents = buildMapInOrder(
    workflow as unknown as Record<string, unknown>,
    WORKFLOW_KEYS,
    (key, value) => {
      if (key === 'jobs') return buildJobs(value as Record<string, Job>);
      return buildNode(value);
    },
  );
  return doc;
}

function buildJobs(jobs: Record<string, Job>): YAMLMap {
  const map = new YAMLMap();
  for (const [jobId, job] of Object.entries(jobs)) {
    map.set(jobId, buildJob(job));
  }
  return map;
}

function buildJob(job: Job): YAMLMap {
  if ('uses' in job && job.uses) {
    return buildMapInOrder(job as unknown as Record<string, unknown>, REUSABLE_JOB_KEYS, (_, v) =>
      buildNode(v),
    );
  }
  return buildMapInOrder(
    job as unknown as Record<string, unknown>,
    NORMAL_JOB_KEYS,
    (key, value) => {
      if (key === 'steps') return buildSteps(value as Step[]);
      return buildNode(value);
    },
  );
}

function buildSteps(steps: Step[]): YAMLSeq {
  const seq = new YAMLSeq();
  for (const step of steps) {
    seq.add(buildStep(step));
  }
  return seq;
}

function buildStep(step: Step): YAMLMap {
  if ('uses' in step && step.uses) {
    return buildMapInOrder(step as unknown as Record<string, unknown>, ACTION_STEP_KEYS, (_, v) =>
      buildNode(v),
    );
  }
  return buildMapInOrder(step as unknown as Record<string, unknown>, RUN_STEP_KEYS, (_, v) =>
    buildNode(v),
  );
}

/**
 * Build a `YAMLMap` by iterating `obj` in canonical key order. Skips
 * keys whose value is `undefined`. Delegates value construction to
 * `valueBuilder` so callers can intercept specific keys (e.g. `jobs`,
 * `steps`) with structured builders.
 */
function buildMapInOrder<K extends readonly string[]>(
  obj: Record<string, unknown>,
  keys: K,
  valueBuilder: (key: K[number], value: unknown) => unknown,
): YAMLMap {
  const map = new YAMLMap();
  for (const key of keys) {
    const value = obj[key];
    if (value === undefined) continue;
    map.set(key, valueBuilder(key as K[number], value));
  }
  return map;
}

/**
 * Generic node builder for values without a canonical key order.
 * Handles strings (with scalar-style detection), arrays (`YAMLSeq`),
 * and plain objects (`YAMLMap` preserving insertion order) — used for
 * unknown structures like `env`, `with`, trigger configs, etc.
 */
function buildNode(value: unknown): unknown {
  if (value === null || value === undefined) return value;
  if (typeof value === 'string') {
    const scalar = new Scalar(value);
    applyScalarStyle(scalar, value);
    return scalar;
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }
  if (Array.isArray(value)) {
    const seq = new YAMLSeq();
    for (const item of value) {
      seq.add(buildNode(item));
    }
    return seq;
  }
  if (typeof value === 'object') {
    const map = new YAMLMap();
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (v === undefined) continue;
      map.set(k, buildNode(v));
    }
    return map;
  }
  return value;
}
