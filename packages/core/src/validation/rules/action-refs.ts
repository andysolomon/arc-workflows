/**
 * `action-refs` rule — validates the shape of `uses` references on
 * action steps.
 *
 * Accepted forms:
 *  - `owner/repo@ref`             (e.g. `actions/checkout@v4`)
 *  - `owner/repo/path@ref`        (subdirectory action)
 *  - `./local-path`               (local action in the same repo)
 *  - `docker://image[:tag]`       (Docker image reference)
 */

import type { NormalJob, Step, Workflow } from '../../schema/index.js';
import type { Rule, ValidationError } from '../errors.js';

const RULE = 'action-refs';

const OWNER_REPO_REF = /^[\w.-]+\/[\w.-]+(?:\/[\w./-]+)?@[\w./-]+$/;
const LOCAL_PATH = /^\.\/.+/;
const DOCKER_IMAGE = /^docker:\/\/.+/;

function isValidRef(ref: string): boolean {
  return OWNER_REPO_REF.test(ref) || LOCAL_PATH.test(ref) || DOCKER_IMAGE.test(ref);
}

function isNormalJobWithSteps(job: Workflow['jobs'][string]): job is NormalJob {
  if (!('runs-on' in job) || job['runs-on'] === undefined) {
    return false;
  }
  return Array.isArray(job.steps);
}

export const actionRefsRule: Rule = (workflow: Workflow) => {
  const errors: ValidationError[] = [];

  if (workflow.jobs === undefined || workflow.jobs === null) {
    return errors;
  }

  for (const [jobId, job] of Object.entries(workflow.jobs)) {
    if (!isNormalJobWithSteps(job)) continue;

    job.steps.forEach((step: Step, index: number) => {
      const loose = step as { uses?: unknown };
      if (typeof loose.uses !== 'string' || loose.uses.length === 0) {
        return;
      }

      if (!isValidRef(loose.uses)) {
        errors.push({
          path: ['jobs', jobId, 'steps', index, 'uses'],
          message: `invalid action reference '${loose.uses}' (expected 'owner/repo@ref', 'owner/repo/path@ref', './local-path', or 'docker://image')`,
          severity: 'error',
          rule: RULE,
        });
      }
    });
  }

  return errors;
};
