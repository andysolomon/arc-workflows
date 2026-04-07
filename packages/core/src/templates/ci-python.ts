import type { Workflow } from '../schema/index.js';

import type { TemplateMetadata } from './types.js';

export interface CiPythonParams {
  pythonVersion?: string;
  branch?: string;
}

export const ciPythonMetadata: TemplateMetadata = {
  id: 'ci-python',
  name: 'CI - Python',
  description: 'Install dependencies and run pytest on pull requests',
  tags: ['ci', 'python'],
};

export function ciPython(params: CiPythonParams = {}): Workflow {
  const pythonVersion = params.pythonVersion ?? '3.x';
  const branch = params.branch ?? 'main';

  return {
    name: 'CI',
    on: { pull_request: { branches: [branch] } },
    jobs: {
      test: {
        'runs-on': 'ubuntu-latest',
        steps: [
          { uses: 'actions/checkout@v4' },
          {
            uses: 'actions/setup-python@v5',
            with: { 'python-version': pythonVersion },
          },
          { run: 'pip install -r requirements.txt' },
          { run: 'pytest' },
        ],
      },
    },
  };
}
