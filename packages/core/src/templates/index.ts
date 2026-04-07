/**
 * Built-in workflow templates.
 *
 * Each template factory returns a fully-typed `Workflow` literal that
 * passes `validate()` with default params. Templates are registered in
 * `TEMPLATES` and can be retrieved by id via `getTemplate()`.
 */

import type { Workflow } from '../schema/index.js';

import { ciNode, ciNodeMetadata, type CiNodeParams } from './ci-node.js';
import { ciPython, ciPythonMetadata, type CiPythonParams } from './ci-python.js';
import { cronTask, cronTaskMetadata, type CronTaskParams } from './cron-task.js';
import { deployAws, deployAwsMetadata, type DeployAwsParams } from './deploy-aws.js';
import { deployVercel, deployVercelMetadata, type DeployVercelParams } from './deploy-vercel.js';
import { dockerBuild, dockerBuildMetadata, type DockerBuildParams } from './docker-build.js';
import {
  manualDispatch,
  manualDispatchMetadata,
  type ManualDispatchParams,
} from './manual-dispatch.js';
import { monorepoCi, monorepoCiMetadata, type MonorepoCiParams } from './monorepo-ci.js';
import {
  releaseSemantic,
  releaseSemanticMetadata,
  type ReleaseSemanticParams,
} from './release-semantic.js';
import { reusable, reusableMetadata, type ReusableParams } from './reusable.js';
import type { TemplateId, TemplateMetadata } from './types.js';

export {
  ciNode,
  ciNodeMetadata,
  ciPython,
  ciPythonMetadata,
  cronTask,
  cronTaskMetadata,
  deployAws,
  deployAwsMetadata,
  deployVercel,
  deployVercelMetadata,
  dockerBuild,
  dockerBuildMetadata,
  manualDispatch,
  manualDispatchMetadata,
  monorepoCi,
  monorepoCiMetadata,
  releaseSemantic,
  releaseSemanticMetadata,
  reusable,
  reusableMetadata,
};

export const TEMPLATES: readonly TemplateMetadata[] = [
  ciNodeMetadata,
  ciPythonMetadata,
  deployVercelMetadata,
  deployAwsMetadata,
  releaseSemanticMetadata,
  dockerBuildMetadata,
  cronTaskMetadata,
  manualDispatchMetadata,
  reusableMetadata,
  monorepoCiMetadata,
];

export function listTemplates(): readonly TemplateMetadata[] {
  return TEMPLATES;
}

export function getTemplate(id: 'ci-node', params?: CiNodeParams): Workflow;
export function getTemplate(id: 'ci-python', params?: CiPythonParams): Workflow;
export function getTemplate(id: 'deploy-vercel', params?: DeployVercelParams): Workflow;
export function getTemplate(id: 'deploy-aws', params?: DeployAwsParams): Workflow;
export function getTemplate(id: 'release-semantic', params?: ReleaseSemanticParams): Workflow;
export function getTemplate(id: 'docker-build', params?: DockerBuildParams): Workflow;
export function getTemplate(id: 'cron-task', params?: CronTaskParams): Workflow;
export function getTemplate(id: 'manual-dispatch', params?: ManualDispatchParams): Workflow;
export function getTemplate(id: 'reusable', params?: ReusableParams): Workflow;
export function getTemplate(id: 'monorepo-ci', params?: MonorepoCiParams): Workflow;
export function getTemplate(id: TemplateId, params?: object): Workflow {
  switch (id) {
    case 'ci-node':
      return ciNode(params as CiNodeParams | undefined);
    case 'ci-python':
      return ciPython(params as CiPythonParams | undefined);
    case 'deploy-vercel':
      return deployVercel(params as DeployVercelParams | undefined);
    case 'deploy-aws':
      return deployAws(params as DeployAwsParams | undefined);
    case 'release-semantic':
      return releaseSemantic(params as ReleaseSemanticParams | undefined);
    case 'docker-build':
      return dockerBuild(params as DockerBuildParams | undefined);
    case 'cron-task':
      return cronTask(params as CronTaskParams | undefined);
    case 'manual-dispatch':
      return manualDispatch(params as ManualDispatchParams | undefined);
    case 'reusable':
      return reusable(params as ReusableParams | undefined);
    case 'monorepo-ci':
      return monorepoCi(params as MonorepoCiParams | undefined);
    default: {
      const _exhaustive: never = id;
      throw new Error(`Unknown template id: ${String(_exhaustive)}`);
    }
  }
}

export type {
  TemplateId,
  TemplateMetadata,
  CiNodeParams,
  CiPythonParams,
  DeployVercelParams,
  DeployAwsParams,
  ReleaseSemanticParams,
  DockerBuildParams,
  CronTaskParams,
  ManualDispatchParams,
  ReusableParams,
  MonorepoCiParams,
};
