import type { Workflow } from '../schema/index.js';

import type { TemplateMetadata } from './types.js';

/**
 * Parameters for the `docker-build` template.
 */
export interface DockerBuildParams {
  branch?: string;
  imageName?: string;
  registry?: string;
}

/** @internal — use `listTemplates()` instead. */
export const dockerBuildMetadata: TemplateMetadata = {
  id: 'docker-build',
  name: 'Docker Build & Push',
  description: 'Build a multi-arch Docker image and push to a registry',
  tags: ['docker', 'build', 'release'],
};

/** @internal — use `getTemplate('docker-build')` instead. */
export function dockerBuild(params: DockerBuildParams = {}): Workflow {
  const branch = params.branch ?? 'main';
  const imageName = params.imageName ?? 'my-image';
  const registry = params.registry ?? 'docker.io';

  const tags = `${registry}/${imageName}:latest,${registry}/${imageName}:\${{ github.sha }}`;

  return {
    name: 'Docker Build & Push',
    on: {
      push: {
        branches: [branch],
        tags: ['v*'],
      },
    },
    jobs: {
      build: {
        'runs-on': 'ubuntu-latest',
        steps: [
          { uses: 'actions/checkout@v4' },
          { uses: 'docker/setup-qemu-action@v3' },
          { uses: 'docker/setup-buildx-action@v3' },
          {
            uses: 'docker/login-action@v3',
            with: {
              registry,
              username: '${{ secrets.DOCKER_USERNAME }}',
              password: '${{ secrets.DOCKER_PASSWORD }}',
            },
          },
          {
            uses: 'docker/build-push-action@v6',
            with: {
              context: '.',
              push: true,
              tags,
            },
          },
        ],
      },
    },
  };
}
