import { describe, expect, it } from 'vitest';

import { generate } from '../generate/index.js';
import { validate } from '../validation/index.js';

import { dockerBuild } from './docker-build.js';

describe('docker-build template', () => {
  it('returns a Workflow', () => {
    const wf = dockerBuild();
    expect(wf.jobs.build).toBeDefined();
  });

  it('passes validation with default params', () => {
    const result = validate(dockerBuild());
    expect(result.errors.filter((e) => e.severity === 'error')).toEqual([]);
    expect(result.valid).toBe(true);
  });

  it('generates expected YAML with default params', () => {
    expect(generate(dockerBuild())).toMatchInlineSnapshot(`
      "name: Docker Build & Push
      on:
        push:
          branches:
            - main
          tags:
            - v*
      jobs:
        build:
          runs-on: ubuntu-latest
          steps:
            - uses: actions/checkout@v4
            - uses: docker/setup-qemu-action@v3
            - uses: docker/setup-buildx-action@v3
            - uses: docker/login-action@v3
              with:
                registry: docker.io
                username: \${{ secrets.DOCKER_USERNAME }}
                password: \${{ secrets.DOCKER_PASSWORD }}
            - uses: docker/build-push-action@v6
              with:
                context: .
                push: true
                tags: docker.io/my-image:latest,docker.io/my-image:\${{ github.sha }}
      "
    `);
  });

  it('respects imageName and registry overrides', () => {
    const yaml = generate(dockerBuild({ imageName: 'app', registry: 'ghcr.io/acme' }));
    expect(yaml).toContain('ghcr.io/acme/app:latest');
  });

  it('respects branch override', () => {
    const yaml = generate(dockerBuild({ branch: 'release' }));
    expect(yaml).toContain('- release');
  });
});
