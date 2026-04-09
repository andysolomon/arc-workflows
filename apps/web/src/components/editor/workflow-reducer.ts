import type { Workflow, Job, NormalJob, Step } from '@arc-workflows/core';

export type WorkflowAction =
  | { type: 'add-job'; id: string; job: NormalJob }
  | { type: 'remove-job'; id: string }
  | { type: 'rename-job'; oldId: string; newId: string }
  | { type: 'add-edge'; source: string; target: string }
  | { type: 'remove-edge'; source: string; target: string }
  | { type: 'update-step'; jobId: string; stepIndex: number; step: Step }
  | { type: 'add-step'; jobId: string; step: Step }
  | { type: 'remove-step'; jobId: string; stepIndex: number };

export function workflowReducer(state: Workflow, action: WorkflowAction): Workflow {
  switch (action.type) {
    case 'add-job':
      return { ...state, jobs: { ...state.jobs, [action.id]: action.job } };

    case 'remove-job': {
      const rest: Record<string, Job> = {};
      for (const [id, job] of Object.entries(state.jobs)) {
        if (id !== action.id) rest[id] = job;
      }
      // Strip from any other job's `needs` list
      const cleaned: Record<string, Job> = {};
      for (const [id, job] of Object.entries(rest)) {
        cleaned[id] = stripNeed(job, action.id);
      }
      return { ...state, jobs: cleaned };
    }

    case 'rename-job': {
      if (!state.jobs[action.oldId] || action.oldId === action.newId) return state;
      if (state.jobs[action.newId]) return state; // collision
      const renamed: Record<string, Job> = {};
      for (const [id, job] of Object.entries(state.jobs)) {
        const newId = id === action.oldId ? action.newId : id;
        renamed[newId] = renameNeed(job, action.oldId, action.newId);
      }
      return { ...state, jobs: renamed };
    }

    case 'add-edge': {
      const targetJob = state.jobs[action.target];
      if (!targetJob) return state;
      if (action.source === action.target) return state;
      if (!state.jobs[action.source]) return state;
      // Cycle prevention: if source is already reachable from target, refuse
      if (wouldCreateCycle(state, action.source, action.target)) return state;
      const updated = addNeed(targetJob, action.source);
      return { ...state, jobs: { ...state.jobs, [action.target]: updated } };
    }

    case 'remove-edge': {
      const targetJob = state.jobs[action.target];
      if (!targetJob) return state;
      const updated = stripNeed(targetJob, action.source);
      return { ...state, jobs: { ...state.jobs, [action.target]: updated } };
    }

    case 'update-step': {
      const job = asNormalJob(state.jobs[action.jobId]);
      if (!job?.steps) return state;
      const newSteps = [...job.steps];
      newSteps[action.stepIndex] = action.step;
      const updatedJob: NormalJob = { ...job, steps: newSteps };
      return { ...state, jobs: { ...state.jobs, [action.jobId]: updatedJob } };
    }

    case 'add-step': {
      const job = asNormalJob(state.jobs[action.jobId]);
      if (!job) return state;
      const newSteps: Step[] = [...(job.steps ?? []), action.step];
      const updatedJob: NormalJob = { ...job, steps: newSteps };
      return { ...state, jobs: { ...state.jobs, [action.jobId]: updatedJob } };
    }

    case 'remove-step': {
      const job = asNormalJob(state.jobs[action.jobId]);
      if (!job?.steps) return state;
      const newSteps = job.steps.filter((_, i) => i !== action.stepIndex);
      const updatedJob: NormalJob = { ...job, steps: newSteps };
      return { ...state, jobs: { ...state.jobs, [action.jobId]: updatedJob } };
    }

    default: {
      const _exhaustive: never = action;
      void _exhaustive;
      return state;
    }
  }
}

// ── helpers ────────────────────────────────────────────────────────────

function asNormalJob(job: Job | undefined): NormalJob | undefined {
  if (!job) return undefined;
  if ('uses' in job && job.uses !== undefined) return undefined;
  return job;
}

function needsOf(job: Job): string[] {
  if (Array.isArray(job.needs)) return job.needs;
  if (typeof job.needs === 'string') return [job.needs];
  return [];
}

function addNeed(job: Job, dep: string): Job {
  const needs = needsOf(job);
  if (needs.includes(dep)) return job;
  return { ...job, needs: [...needs, dep] } as unknown as Job;
}

function stripNeed(job: Job, dep: string): Job {
  const needs = needsOf(job);
  const filtered = needs.filter((n) => n !== dep);
  if (filtered.length === needs.length) return job;
  if (filtered.length === 0) {
    const copy = { ...job } as unknown as Job & { needs?: string | string[] };
    delete copy.needs;
    return copy;
  }
  return { ...job, needs: filtered } as unknown as Job;
}

function renameNeed(job: Job, oldId: string, newId: string): Job {
  const needs = needsOf(job);
  if (!needs.includes(oldId)) return job;
  const renamed = needs.map((n) => (n === oldId ? newId : n));
  return { ...job, needs: renamed } as unknown as Job;
}

function wouldCreateCycle(workflow: Workflow, source: string, target: string): boolean {
  // Walk needs from source to see if it can reach target
  const visited = new Set<string>();
  function walk(node: string): boolean {
    if (node === target) return true;
    if (visited.has(node)) return false;
    visited.add(node);
    const job = workflow.jobs[node];
    if (!job) return false;
    return needsOf(job).some(walk);
  }
  return walk(source);
}
