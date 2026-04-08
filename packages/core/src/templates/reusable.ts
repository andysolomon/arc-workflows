import type { Workflow, WorkflowCallInput, WorkflowCallSecret } from '../schema/index.js';

import type { TemplateMetadata } from './types.js';

/**
 * Parameters for the `reusable` template.
 */
export interface ReusableParams {
  callableInputs?: Record<string, WorkflowCallInput>;
  callableSecrets?: Record<string, WorkflowCallSecret>;
}

/** @internal — use `listTemplates()` instead. */
export const reusableMetadata: TemplateMetadata = {
  id: 'reusable',
  name: 'Reusable Workflow',
  description: 'A workflow_call entrypoint with typed inputs and secrets',
  tags: ['reusable', 'workflow_call'],
};

const DEFAULT_INPUTS: Record<string, WorkflowCallInput> = {
  'config-path': {
    type: 'string',
    required: true,
    description: 'Path to config file',
  },
};

const DEFAULT_SECRETS: Record<string, WorkflowCallSecret> = {
  'api-token': {
    required: true,
    description: 'API token for the service',
  },
};

/** @internal — use `getTemplate('reusable')` instead. */
export function reusable(params: ReusableParams = {}): Workflow {
  const inputs = params.callableInputs ?? DEFAULT_INPUTS;
  const secrets = params.callableSecrets ?? DEFAULT_SECRETS;

  return {
    name: 'Reusable Workflow',
    on: {
      workflow_call: { inputs, secrets },
    },
    jobs: {
      run: {
        'runs-on': 'ubuntu-latest',
        steps: [
          { uses: 'actions/checkout@v4' },
          { run: 'echo "Running with config ${{ inputs.config-path }}"' },
        ],
      },
    },
  };
}
