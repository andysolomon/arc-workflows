import { setup, assign } from 'xstate';
import type { WizardContext } from './types.js';
import type { NormalJob, Step, Triggers, Workflow } from '@arc-workflows/core';

/**
 * Optional input passed when creating a wizard actor.
 *
 * - `workflow` — pre-hydrate the wizard with an existing workflow
 *   (used by `runEdit` to load YAML into the wizard).
 * - `sourcePath` — the file the workflow was loaded from; becomes the
 *   default save path on the confirm page.
 *
 * When undefined (the default for `runCreate`), the machine starts
 * with an empty workflow and lands at `welcome`.
 */
export type WizardInput = { workflow?: Workflow; sourcePath?: string } | undefined;

export const wizardMachine = setup({
  types: {
    context: {} as WizardContext,
    input: {} as WizardInput,
    events: {} as
      | { type: 'SELECT_CREATE' }
      | { type: 'SELECT_TEMPLATE'; templateId: string }
      | { type: 'SELECT_BLANK' }
      | { type: 'SET_NAME'; name: string }
      | { type: 'CONFIGURE_TRIGGERS'; triggers: Triggers }
      | { type: 'ADD_JOB'; id: string; job: NormalJob }
      | { type: 'EDIT_JOB'; id: string }
      | { type: 'REMOVE_JOB'; id: string }
      | { type: 'ADD_STEP'; step: Step }
      | { type: 'EDIT_STEP'; index: number }
      | { type: 'UPDATE_STEP'; jobId: string; stepIndex: number; step: Step }
      | { type: 'REMOVE_STEP'; jobId: string; stepIndex: number }
      | { type: 'NEXT' }
      | { type: 'BACK' }
      | { type: 'CONFIRM'; outputPath: string },
  },
}).createMachine({
  id: 'wizard',
  initial: 'bootstrap',
  context: ({ input }) => ({
    workflow: input?.workflow ?? { jobs: {} },
    currentJobId: null,
    currentStepIndex: null,
    templateId: null,
    outputPath: input?.sourcePath ?? null,
  }),
  states: {
    bootstrap: {
      always: [
        {
          guard: ({ context }) =>
            context.outputPath !== null &&
            Object.keys(context.workflow?.jobs ?? {}).length > 0,
          target: 'jobs',
        },
        { target: 'welcome' },
      ],
    },
    welcome: {
      on: { SELECT_CREATE: 'templateSelect' },
    },
    templateSelect: {
      on: {
        SELECT_TEMPLATE: {
          target: 'workflowName',
          actions: assign({
            templateId: ({ event }) => event.templateId,
          }),
        },
        SELECT_BLANK: {
          target: 'workflowName',
          actions: assign({ templateId: () => null }),
        },
        BACK: 'welcome',
      },
    },
    workflowName: {
      on: {
        SET_NAME: {
          actions: assign({
            workflow: ({ context, event }) => ({
              ...context.workflow,
              name: event.name,
            }),
          }),
        },
        NEXT: 'triggers',
        BACK: 'templateSelect',
      },
    },
    triggers: {
      on: {
        CONFIGURE_TRIGGERS: {
          actions: assign({
            workflow: ({ context, event }) => ({
              ...context.workflow,
              on: event.triggers,
            }),
          }),
        },
        NEXT: 'jobs',
        BACK: 'workflowName',
      },
    },
    jobs: {
      on: {
        ADD_JOB: {
          actions: assign({
            workflow: ({ context, event }) => ({
              ...context.workflow,
              jobs: {
                ...(context.workflow.jobs ?? {}),
                [event.id]: event.job,
              },
            }),
          }),
        },
        EDIT_JOB: {
          target: 'jobConfig',
          actions: assign({ currentJobId: ({ event }) => event.id }),
        },
        REMOVE_JOB: {
          actions: assign({
            workflow: ({ context, event }) => {
              if (!context.workflow.jobs) return context.workflow;
              const next = { ...context.workflow.jobs };
              delete next[event.id];
              return { ...context.workflow, jobs: next };
            },
          }),
        },
        NEXT: 'confirm',
        BACK: 'triggers',
      },
    },
    jobConfig: {
      on: {
        NEXT: 'steps',
        BACK: 'jobs',
      },
    },
    steps: {
      on: {
        ADD_STEP: {
          actions: assign({
            workflow: ({ context, event }) => {
              const jobId = context.currentJobId;
              if (!jobId) return context.workflow;
              const jobs = { ...(context.workflow.jobs ?? {}) };
              const job = jobs[jobId];
              if (!job || !('steps' in job)) return context.workflow;
              const normalJob = job as NormalJob;
              jobs[jobId] = {
                ...normalJob,
                steps: [...normalJob.steps, event.step],
              };
              return { ...context.workflow, jobs };
            },
          }),
        },
        EDIT_STEP: {
          target: 'stepConfig',
          actions: assign({
            currentStepIndex: ({ event }) => event.index,
          }),
        },
        UPDATE_STEP: {
          actions: assign({
            workflow: ({ context, event }) => {
              if (!context.workflow.jobs) return context.workflow;
              const job = context.workflow.jobs[event.jobId];
              if (!job || !('steps' in job)) return context.workflow;
              const normalJob = job as NormalJob;
              const newSteps = [...normalJob.steps];
              newSteps[event.stepIndex] = event.step;
              return {
                ...context.workflow,
                jobs: {
                  ...context.workflow.jobs,
                  [event.jobId]: { ...normalJob, steps: newSteps },
                },
              };
            },
          }),
        },
        REMOVE_STEP: {
          actions: assign({
            workflow: ({ context, event }) => {
              if (!context.workflow.jobs) return context.workflow;
              const job = context.workflow.jobs[event.jobId];
              if (!job || !('steps' in job)) return context.workflow;
              const normalJob = job as NormalJob;
              const newSteps = normalJob.steps.filter((_, i) => i !== event.stepIndex);
              return {
                ...context.workflow,
                jobs: {
                  ...context.workflow.jobs,
                  [event.jobId]: { ...normalJob, steps: newSteps },
                },
              };
            },
          }),
        },
        NEXT: 'jobs',
        BACK: 'jobConfig',
      },
    },
    stepConfig: {
      on: {
        NEXT: 'steps',
        BACK: 'steps',
      },
    },
    confirm: {
      on: {
        CONFIRM: {
          target: 'done',
          actions: assign({
            outputPath: ({ event }) => event.outputPath,
          }),
        },
        BACK: 'jobs',
      },
    },
    done: {
      type: 'final',
    },
  },
});
