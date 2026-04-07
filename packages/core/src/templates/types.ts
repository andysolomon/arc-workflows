/**
 * Public types for the built-in workflow templates.
 */

export type TemplateId =
  | 'ci-node'
  | 'ci-python'
  | 'deploy-vercel'
  | 'deploy-aws'
  | 'release-semantic'
  | 'docker-build'
  | 'cron-task'
  | 'manual-dispatch'
  | 'reusable'
  | 'monorepo-ci';

export interface TemplateMetadata {
  id: TemplateId;
  name: string;
  description: string;
  tags: string[];
}
