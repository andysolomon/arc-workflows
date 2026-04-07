import { describe, expect, it } from 'vitest';

import { generate } from '../generate/index.js';
import { validate } from '../validation/index.js';

import { deployAws } from './deploy-aws.js';

describe('deploy-aws template', () => {
  it('returns a Workflow', () => {
    const wf = deployAws();
    expect(wf.jobs.deploy).toBeDefined();
  });

  it('passes validation with default params', () => {
    const result = validate(deployAws());
    expect(result.errors.filter((e) => e.severity === 'error')).toEqual([]);
    expect(result.valid).toBe(true);
  });

  it('generates expected YAML with default params', () => {
    expect(generate(deployAws())).toMatchInlineSnapshot(`
      "name: Deploy to AWS
      on:
        push:
          branches:
            - main
      jobs:
        deploy:
          runs-on: ubuntu-latest
          permissions:
            id-token: write
            contents: read
          steps:
            - uses: actions/checkout@v4
            - uses: aws-actions/configure-aws-credentials@v4
              with:
                aws-region: us-east-1
                role-to-assume: \${{ secrets.AWS_ROLE_ARN }}
            - id: login-ecr
              uses: aws-actions/amazon-ecr-login@v2
            - name: Build, tag, and push image to ECR
              run: IMAGE_TAG=\${{ github.sha }}

                REGISTRY=\${{ steps.login-ecr.outputs.registry }}

                docker build -t $REGISTRY/my-repo:$IMAGE_TAG .

                docker push $REGISTRY/my-repo:$IMAGE_TAG
            - name: Update ECS service
              run: aws ecs update-service --cluster my-cluster --service my-service --force-new-deployment --region us-east-1
      "
    `);
  });

  it('respects region override', () => {
    const yaml = generate(deployAws({ region: 'eu-west-1' }));
    expect(yaml).toContain('aws-region: eu-west-1');
    expect(yaml).toContain('--region eu-west-1');
  });

  it('respects ecrRepository override', () => {
    const yaml = generate(deployAws({ ecrRepository: 'custom-repo' }));
    expect(yaml).toContain('custom-repo');
  });

  it('respects ecsCluster and ecsService override', () => {
    const yaml = generate(deployAws({ ecsCluster: 'prod-cluster', ecsService: 'web' }));
    expect(yaml).toContain('--cluster prod-cluster');
    expect(yaml).toContain('--service web');
  });
});
