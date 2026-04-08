import type { Workflow } from '../schema/index.js';

import type { TemplateMetadata } from './types.js';

/**
 * Parameters for the `deploy-vercel` template.
 */
export interface DeployVercelParams {
  branch?: string;
  environment?: string;
}

/** @internal — use `listTemplates()` instead. */
export const deployVercelMetadata: TemplateMetadata = {
  id: 'deploy-vercel',
  name: 'Deploy to Vercel',
  description: 'Build and deploy to Vercel on push to the configured branch',
  tags: ['deploy', 'vercel'],
};

/** @internal — use `getTemplate('deploy-vercel')` instead. */
export function deployVercel(params: DeployVercelParams = {}): Workflow {
  const branch = params.branch ?? 'main';
  const environment = params.environment ?? 'production';
  const isProd = environment === 'production';
  const buildCmd = isProd
    ? 'vercel build --prod --token=${{ secrets.VERCEL_TOKEN }}'
    : 'vercel build --token=${{ secrets.VERCEL_TOKEN }}';
  const deployCmd = isProd
    ? 'vercel deploy --prebuilt --prod --token=${{ secrets.VERCEL_TOKEN }}'
    : 'vercel deploy --prebuilt --token=${{ secrets.VERCEL_TOKEN }}';

  return {
    name: 'Deploy to Vercel',
    on: { push: { branches: [branch] } },
    jobs: {
      deploy: {
        'runs-on': 'ubuntu-latest',
        env: {
          VERCEL_ORG_ID: '${{ secrets.VERCEL_ORG_ID }}',
          VERCEL_PROJECT_ID: '${{ secrets.VERCEL_PROJECT_ID }}',
        },
        steps: [
          { uses: 'actions/checkout@v4' },
          {
            uses: 'actions/setup-node@v4',
            with: { 'node-version': 'lts/*' },
          },
          { run: 'npm install --global vercel@latest' },
          {
            run: `vercel pull --yes --environment=${environment} --token=\${{ secrets.VERCEL_TOKEN }}`,
          },
          { run: buildCmd },
          { run: deployCmd },
        ],
      },
    },
  };
}
