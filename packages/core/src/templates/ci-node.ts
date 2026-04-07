import type { Workflow } from '../schema/index.js';

import type { TemplateMetadata } from './types.js';

export interface CiNodeParams {
  nodeVersion?: string;
  packageManager?: 'npm' | 'pnpm' | 'yarn';
  branch?: string;
}

export const ciNodeMetadata: TemplateMetadata = {
  id: 'ci-node',
  name: 'CI - Node.js',
  description: 'Install, lint, and test a Node.js project on pull requests',
  tags: ['ci', 'node', 'javascript', 'typescript'],
};

export function ciNode(params: CiNodeParams = {}): Workflow {
  const nodeVersion = params.nodeVersion ?? 'lts/*';
  const pm = params.packageManager ?? 'npm';
  const branch = params.branch ?? 'main';

  const installCmd =
    pm === 'npm'
      ? 'npm ci'
      : pm === 'pnpm'
        ? 'pnpm install --frozen-lockfile'
        : 'yarn install --frozen-lockfile';
  const lintCmd = `${pm} run lint`;
  const testCmd = `${pm} test`;

  return {
    name: 'CI',
    on: { pull_request: { branches: [branch] } },
    jobs: {
      build: {
        'runs-on': 'ubuntu-latest',
        steps: [
          { uses: 'actions/checkout@v4' },
          {
            uses: 'actions/setup-node@v4',
            with: { 'node-version': nodeVersion, cache: pm },
          },
          { run: installCmd },
          { run: lintCmd },
          { run: testCmd },
        ],
      },
    },
  };
}
