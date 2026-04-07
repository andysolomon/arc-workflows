import type { Workflow } from '../schema/index.js';

import type { TemplateMetadata } from './types.js';

export interface DeployAwsParams {
  branch?: string;
  region?: string;
  ecrRepository?: string;
  ecsCluster?: string;
  ecsService?: string;
}

export const deployAwsMetadata: TemplateMetadata = {
  id: 'deploy-aws',
  name: 'Deploy to AWS (ECR + ECS)',
  description: 'Build a Docker image, push to ECR, and update an ECS service',
  tags: ['deploy', 'aws', 'ecs', 'docker'],
};

export function deployAws(params: DeployAwsParams = {}): Workflow {
  const branch = params.branch ?? 'main';
  const region = params.region ?? 'us-east-1';
  const ecrRepository = params.ecrRepository ?? 'my-repo';
  const ecsCluster = params.ecsCluster ?? 'my-cluster';
  const ecsService = params.ecsService ?? 'my-service';

  const buildAndPush = [
    'IMAGE_TAG=${{ github.sha }}',
    `REGISTRY=\${{ steps.login-ecr.outputs.registry }}`,
    `docker build -t $REGISTRY/${ecrRepository}:$IMAGE_TAG .`,
    `docker push $REGISTRY/${ecrRepository}:$IMAGE_TAG`,
  ].join('\n');

  return {
    name: 'Deploy to AWS',
    on: { push: { branches: [branch] } },
    jobs: {
      deploy: {
        'runs-on': 'ubuntu-latest',
        permissions: {
          'id-token': 'write',
          contents: 'read',
        },
        steps: [
          { uses: 'actions/checkout@v4' },
          {
            uses: 'aws-actions/configure-aws-credentials@v4',
            with: {
              'aws-region': region,
              'role-to-assume': '${{ secrets.AWS_ROLE_ARN }}',
            },
          },
          {
            id: 'login-ecr',
            uses: 'aws-actions/amazon-ecr-login@v2',
          },
          {
            name: 'Build, tag, and push image to ECR',
            run: buildAndPush,
          },
          {
            name: 'Update ECS service',
            run: `aws ecs update-service --cluster ${ecsCluster} --service ${ecsService} --force-new-deployment --region ${region}`,
          },
        ],
      },
    },
  };
}
