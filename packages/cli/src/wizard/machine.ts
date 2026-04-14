import { setup, assign } from 'xstate';
import type { WizardContext } from './types.js';
import type { Workflow, NormalJob } from '@arc-workflows/core';
import { getTemplate, type TemplateId } from '@arc-workflows/core';

const initialContext: WizardContext = {
  workflow: { jobs: {} },
  currentJobId: null,
  currentStepIndex: null,
  templateId: null,
};

export const wizardMachine = setup({
  types: {
    context: {} as WizardContext,
    events: {} as import('./types.js').WizardEvent,
  },
}).createMachine({
  id: 'wizard',
  initial: 'welcome',
  context: initialContext,
  states: {
    welcome: {
      on: {
        SELECT_CREATE: 'templateSelect',
      },
    },
    templateSelect: {
      on: {
        SELECT_TEMPLATE: {
          target: 'workflowName',
          actions: assign({
            templateId: ({ event }) => event.templateId,
            workflow: ({ event }): Partial<Workflow> => {
              try {
                // Cast to implementation signature to avoid overload resolution issues
                const getter = getTemplate as (id: TemplateId) => Workflow;
                const tpl: Workflow = getter(event.templateId as TemplateId);
                // Build partial explicitly to satisfy exactOptionalPropertyTypes
                const partial: Partial<Workflow> = { on: tpl.on, jobs: tpl.jobs };
                if (tpl.name !== undefined) partial.name = tpl.name;
                if (tpl['run-name'] !== undefined) partial['run-name'] = tpl['run-name'];
                if (tpl.env !== undefined) partial.env = tpl.env;
                if (tpl.permissions !== undefined) partial.permissions = tpl.permissions;
                if (tpl.defaults !== undefined) partial.defaults = tpl.defaults;
                if (tpl.concurrency !== undefined) partial.concurrency = tpl.concurrency;
                return partial;
              } catch {
                return { jobs: {} };
              }
            },
          }),
        },
        SELECT_BLANK: {
          target: 'workflowName',
          actions: assign({
            templateId: () => null,
            workflow: () => ({ jobs: {} }),
          }),
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
              jobs: { ...context.workflow.jobs, [event.id]: event.job },
            }),
          }),
        },
        EDIT_JOB: {
          target: 'jobConfig',
          actions: assign({
            currentJobId: ({ event }) => event.id,
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
            workflow: ({ context, event }): Partial<Workflow> => {
              const jobId = context.currentJobId;
              if (!jobId || !context.workflow.jobs) return context.workflow;
              const job = context.workflow.jobs[jobId];
              if (!job || !('steps' in job)) return context.workflow;
              const normalJob = job as NormalJob;
              const updatedJob: NormalJob = {
                ...normalJob,
                steps: [...normalJob.steps, event.step],
              };
              const jobs: Record<string, NormalJob> = {
                ...(context.workflow.jobs as Record<string, NormalJob>),
                [jobId]: updatedJob,
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
        DONE_WITH_JOB: 'jobs',
        BACK: 'jobConfig',
      },
    },
    stepConfig: {
      on: {
        DONE_WITH_STEP: 'steps',
        BACK: 'steps',
      },
    },
    confirm: {
      on: {
        CONFIRM: 'done',
        BACK: 'jobs',
      },
    },
    done: {
      type: 'final',
    },
  },
});

export type WizardMachine = typeof wizardMachine;
