import type { Workflow } from '@arc-workflows/core';

export interface WizardContext {
  workflow: Partial<Workflow>;
  currentJobId: string | null;
  currentStepIndex: number | null;
  templateId: string | null;
}
