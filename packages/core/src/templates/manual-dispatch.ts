import type { Workflow, WorkflowDispatchInput } from '../schema/index.js';

import type { TemplateMetadata } from './types.js';

export interface ManualDispatchParams {
  inputs?: Record<string, WorkflowDispatchInput>;
}

export const manualDispatchMetadata: TemplateMetadata = {
  id: 'manual-dispatch',
  name: 'Manual Dispatch',
  description: 'Manually triggered workflow with typed inputs',
  tags: ['manual', 'workflow_dispatch'],
};

const DEFAULT_INPUTS: Record<string, WorkflowDispatchInput> = {
  environment: {
    type: 'choice',
    options: ['staging', 'production'],
    default: 'staging',
    required: true,
    description: 'Target environment',
  },
};

export function manualDispatch(params: ManualDispatchParams = {}): Workflow {
  const inputs = params.inputs ?? DEFAULT_INPUTS;

  return {
    name: 'Manual Dispatch',
    on: {
      workflow_dispatch: { inputs },
    },
    jobs: {
      run: {
        'runs-on': 'ubuntu-latest',
        steps: [
          { uses: 'actions/checkout@v4' },
          { run: 'echo "Deploying to ${{ inputs.environment }}"' },
        ],
      },
    },
  };
}
