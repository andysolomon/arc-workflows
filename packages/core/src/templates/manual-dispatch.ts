import type { Workflow, WorkflowDispatchInput } from '../schema/index.js';

import type { TemplateMetadata } from './types.js';

/**
 * Parameters for the `manual-dispatch` template.
 */
export interface ManualDispatchParams {
  inputs?: Record<string, WorkflowDispatchInput>;
}

/** @internal — use `listTemplates()` instead. */
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

/** @internal — use `getTemplate('manual-dispatch')` instead. */
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
