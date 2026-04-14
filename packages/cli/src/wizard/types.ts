import type { Workflow, NormalJob, Step, Triggers } from '@arc-workflows/core';

export interface WizardContext {
  workflow: Partial<Workflow>;
  currentJobId: string | null;
  currentStepIndex: number | null;
  templateId: string | null;
}

export type WizardEvent =
  | { type: 'SELECT_CREATE' }
  | { type: 'SELECT_LIST_TEMPLATES' }
  | { type: 'SELECT_TEMPLATE'; templateId: string }
  | { type: 'SELECT_BLANK' }
  | { type: 'SET_NAME'; name: string }
  | { type: 'CONFIGURE_TRIGGERS'; triggers: Triggers }
  | { type: 'ADD_JOB'; id: string; job: NormalJob }
  | { type: 'EDIT_JOB'; id: string }
  | { type: 'DONE_WITH_JOB' }
  | { type: 'ADD_STEP'; step: Step }
  | { type: 'EDIT_STEP'; index: number }
  | { type: 'DONE_WITH_STEP' }
  | { type: 'NEXT' }
  | { type: 'BACK' }
  | { type: 'CONFIRM' };
