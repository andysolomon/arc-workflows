/**
 * `job-deps` rule — validates `Job.needs` references and detects
 * cycles.
 *
 * Strategy:
 *  1. Normalize each job's `needs` to a string array.
 *  2. Flag references to undefined job ids.
 *  3. Run Kahn's algorithm on the remaining (defined-target) edges.
 *     Any nodes left with non-zero indegree after the BFS are part of
 *     (or downstream of) a cycle. For each such node we walk the
 *     `needs` graph to find a concrete cycle and report it.
 */

import type { Workflow } from '../../schema/index.js';
import type { Rule, ValidationError } from '../errors.js';

const RULE = 'job-deps';

function normalizeNeeds(needs: string | string[] | undefined): string[] {
  if (needs === undefined) return [];
  return Array.isArray(needs) ? needs : [needs];
}

/**
 * Given a node known to be in (or downstream of) a cycle, walk `needs`
 * edges until we revisit a node — that's our cycle.
 *
 * Returns the cycle as an ordered list that starts and ends at the
 * same node, e.g. `['a', 'b', 'c', 'a']`.
 */
function findCycle(start: string, needsMap: Map<string, string[]>): string[] {
  const path: string[] = [];
  const seenIndex = new Map<string, number>();
  let current = start;

  // Walk forward; at each node pick the first dep that is itself still
  // cyclic (every step stays within the SCC because Kahn already
  // drained everything else).
  while (!seenIndex.has(current)) {
    seenIndex.set(current, path.length);
    path.push(current);
    const deps = needsMap.get(current) ?? [];
    if (deps.length === 0) {
      // Shouldn't happen for a node flagged cyclic, but guard anyway.
      return [start, start];
    }
    const next = deps[0];
    if (next === undefined) {
      return [start, start];
    }
    current = next;
  }

  const cycleStart = seenIndex.get(current) ?? 0;
  return [...path.slice(cycleStart), current];
}

export const jobDepsRule: Rule = (workflow: Workflow) => {
  const errors: ValidationError[] = [];

  if (workflow.jobs === undefined || workflow.jobs === null) {
    return errors;
  }

  const jobIds = Object.keys(workflow.jobs);
  const jobIdSet = new Set(jobIds);

  // Build needs map, reporting unknown targets.
  const needsMap = new Map<string, string[]>();
  for (const jobId of jobIds) {
    const job = workflow.jobs[jobId];
    if (job === undefined) continue;
    const needs = normalizeNeeds(job.needs);
    const known: string[] = [];
    for (const target of needs) {
      if (!jobIdSet.has(target)) {
        errors.push({
          path: ['jobs', jobId, 'needs'],
          message: `job '${jobId}' depends on undefined job '${target}'`,
          severity: 'error',
          rule: RULE,
        });
      } else {
        known.push(target);
      }
    }
    needsMap.set(jobId, known);
  }

  // Kahn's algorithm. Edge direction: needs target → job (job depends
  // on target, so target must complete first). Indegree[job] = number
  // of targets job still waits on.
  const indegree = new Map<string, number>();
  for (const jobId of jobIds) {
    indegree.set(jobId, (needsMap.get(jobId) ?? []).length);
  }

  const queue: string[] = [];
  for (const [jobId, deg] of indegree) {
    if (deg === 0) queue.push(jobId);
  }

  // Reverse adjacency: for each target, list the jobs that need it.
  const dependents = new Map<string, string[]>();
  for (const jobId of jobIds) {
    for (const target of needsMap.get(jobId) ?? []) {
      const list = dependents.get(target) ?? [];
      list.push(jobId);
      dependents.set(target, list);
    }
  }

  let processed = 0;
  while (queue.length > 0) {
    const node = queue.shift();
    if (node === undefined) break;
    processed += 1;
    for (const dependent of dependents.get(node) ?? []) {
      const next = (indegree.get(dependent) ?? 0) - 1;
      indegree.set(dependent, next);
      if (next === 0) queue.push(dependent);
    }
  }

  if (processed === jobIds.length) {
    return errors;
  }

  // Some nodes remain — find cycles. Report one error per distinct
  // cycle, keyed by the set of nodes it contains.
  const reportedCycles = new Set<string>();
  for (const jobId of jobIds) {
    if ((indegree.get(jobId) ?? 0) === 0) continue;
    const cycle = findCycle(jobId, needsMap);
    // Cycle key: sorted set of distinct nodes.
    const distinct = [...new Set(cycle)].sort();
    const key = distinct.join('|');
    if (reportedCycles.has(key)) continue;
    reportedCycles.add(key);

    const firstNode = cycle[0] ?? jobId;
    errors.push({
      path: ['jobs', firstNode],
      message: `job '${firstNode}' has cyclic dependency: ${cycle.join(' → ')}`,
      severity: 'error',
      rule: RULE,
    });
  }

  return errors;
};
