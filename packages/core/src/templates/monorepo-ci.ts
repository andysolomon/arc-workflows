import type { Job, Workflow } from '../schema/index.js';

import type { TemplateMetadata } from './types.js';

export interface MonorepoCiParams {
  branch?: string;
  packages?: string[];
}

export const monorepoCiMetadata: TemplateMetadata = {
  id: 'monorepo-ci',
  name: 'Monorepo CI',
  description: 'Per-package CI jobs gated by path filters via dorny/paths-filter',
  tags: ['ci', 'monorepo'],
};

/**
 * Slugify a package path into a job-id-safe identifier. Replaces
 * filesystem separators and other unsafe characters with dashes.
 */
function slugify(pkgPath: string): string {
  return pkgPath
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
}

export function monorepoCi(params: MonorepoCiParams = {}): Workflow {
  const branch = params.branch ?? 'main';
  const packages = params.packages ?? ['packages/a', 'packages/b'];

  const slugs = packages.map(slugify);
  const filters = packages.map((pkg, i) => `${slugs[i] ?? ''}: '${pkg}/**'`).join('\n');

  const changesOutputs: Record<string, string> = {};
  for (const slug of slugs) {
    changesOutputs[slug] = `\${{ steps.filter.outputs.${slug} }}`;
  }

  const jobs: Record<string, Job> = {
    changes: {
      'runs-on': 'ubuntu-latest',
      outputs: changesOutputs,
      steps: [
        { uses: 'actions/checkout@v4' },
        {
          id: 'filter',
          uses: 'dorny/paths-filter@v3',
          with: { filters },
        },
      ],
    },
  };

  for (let i = 0; i < packages.length; i++) {
    const pkg = packages[i] ?? '';
    const slug = slugs[i] ?? '';
    const jobId = `${slug}-ci`;
    jobs[jobId] = {
      'runs-on': 'ubuntu-latest',
      needs: 'changes',
      if: `needs.changes.outputs.${slug} == 'true'`,
      steps: [{ uses: 'actions/checkout@v4' }, { run: `echo "Building ${pkg}"` }],
    };
  }

  return {
    name: 'Monorepo CI',
    on: {
      pull_request: {
        branches: [branch],
        paths: packages.map((p) => `${p}/**`),
      },
    },
    jobs,
  };
}
