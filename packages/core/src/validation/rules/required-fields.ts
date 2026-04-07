/**
 * `required-fields` rule — checks that required GitHub Actions fields
 * are present.
 *
 * This rule guards against inputs that satisfy TypeScript's structural
 * types only loosely (e.g. JSON-deserialized workflows where a step
 * might accidentally have both `uses` and `run`, or neither).
 */

import type { Job, Step, Workflow } from '../../schema/index.js';
import type { Rule, ValidationError } from '../errors.js';

const RULE = 'required-fields';

function err(path: (string | number)[], message: string): ValidationError {
  return { path, message, severity: 'error', rule: RULE };
}

function isNormalJob(job: Job): boolean {
  return 'runs-on' in job && job['runs-on'] !== undefined;
}

function isReusableJob(job: Job): boolean {
  return 'uses' in job && typeof (job as { uses?: unknown }).uses === 'string';
}

function checkStep(step: Step, jobId: string, index: number, errors: ValidationError[]): void {
  // Treat the step as a loose record so we can detect the "both" and
  // "neither" escapes that the structural `never` discriminator lets
  // through at the type level but not at runtime.
  const loose = step as { uses?: unknown; run?: unknown };
  const hasUses = typeof loose.uses === 'string' && loose.uses.length > 0;
  const hasRun = typeof loose.run === 'string' && loose.run.length > 0;

  if (hasUses && hasRun) {
    errors.push(
      err(
        ['jobs', jobId, 'steps', index],
        `step ${String(index)} in job '${jobId}' has both 'uses' and 'run' (must have exactly one)`,
      ),
    );
    return;
  }

  if (!hasUses && !hasRun) {
    errors.push(
      err(
        ['jobs', jobId, 'steps', index],
        `step ${String(index)} in job '${jobId}' must have either 'uses' or 'run'`,
      ),
    );
  }
}

export const requiredFieldsRule: Rule = (workflow: Workflow) => {
  const errors: ValidationError[] = [];

  // Workflow.on
  if (workflow.on === undefined || workflow.on === null) {
    errors.push(err(['on'], "workflow is missing required field 'on'"));
  }

  // Workflow.jobs
  if (workflow.jobs === undefined || workflow.jobs === null) {
    errors.push(err(['jobs'], "workflow is missing required field 'jobs'"));
    return errors;
  }

  const jobIds = Object.keys(workflow.jobs);
  if (jobIds.length === 0) {
    errors.push(err(['jobs'], "workflow 'jobs' must not be empty"));
    return errors;
  }

  for (const jobId of jobIds) {
    const job = workflow.jobs[jobId];
    if (job === undefined) continue;

    const normal = isNormalJob(job);
    const reusable = isReusableJob(job);

    if (!normal && !reusable) {
      errors.push(
        err(
          ['jobs', jobId],
          `job '${jobId}' must have either 'runs-on' (normal job) or 'uses' (reusable workflow call)`,
        ),
      );
      continue;
    }

    if (normal) {
      const normalJob = job as { 'runs-on'?: unknown; steps?: unknown };
      if (
        normalJob['runs-on'] === undefined ||
        normalJob['runs-on'] === null ||
        normalJob['runs-on'] === ''
      ) {
        errors.push(
          err(['jobs', jobId, 'runs-on'], `job '${jobId}' is missing required field 'runs-on'`),
        );
      }

      if (!Array.isArray(normalJob.steps) || normalJob.steps.length === 0) {
        errors.push(err(['jobs', jobId, 'steps'], `job '${jobId}' must have at least one step`));
      } else {
        const steps = normalJob.steps as Step[];
        steps.forEach((step, i) => {
          checkStep(step, jobId, i, errors);
        });
      }
    } else if (reusable) {
      const reusableJob = job as { uses?: unknown };
      if (typeof reusableJob.uses !== 'string' || reusableJob.uses.length === 0) {
        errors.push(
          err(['jobs', jobId, 'uses'], `reusable job '${jobId}' is missing required field 'uses'`),
        );
      }
    }
  }

  return errors;
};
