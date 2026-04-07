import type { Workflow } from '../schema/index.js';

import type { TemplateMetadata } from './types.js';

export interface ReleaseSemanticParams {
  branch?: string;
  nodeVersion?: string;
}

export const releaseSemanticMetadata: TemplateMetadata = {
  id: 'release-semantic',
  name: 'Semantic Release',
  description: 'Run semantic-release on push to publish versioned releases',
  tags: ['release', 'semver', 'changelog'],
};

export function releaseSemantic(params: ReleaseSemanticParams = {}): Workflow {
  const branch = params.branch ?? 'main';
  const nodeVersion = params.nodeVersion ?? 'lts/*';

  return {
    name: 'Release',
    on: { push: { branches: [branch] } },
    permissions: {
      contents: 'write',
      issues: 'write',
      'pull-requests': 'write',
    },
    jobs: {
      release: {
        'runs-on': 'ubuntu-latest',
        steps: [
          {
            uses: 'actions/checkout@v4',
            with: { 'fetch-depth': 0 },
          },
          {
            uses: 'actions/setup-node@v4',
            with: { 'node-version': nodeVersion },
          },
          { run: 'npm ci' },
          {
            run: 'npx semantic-release',
            env: {
              GITHUB_TOKEN: '${{ secrets.GITHUB_TOKEN }}',
              NPM_TOKEN: '${{ secrets.NPM_TOKEN }}',
            },
          },
        ],
      },
    },
  };
}
