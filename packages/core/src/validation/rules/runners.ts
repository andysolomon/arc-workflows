/**
 * `runners` rule — warns when a job's `runs-on` references a label that
 * isn't a known GitHub-hosted runner. Self-hosted labels and
 * expression-driven labels (`${{ matrix.os }}`) are intentionally allowed
 * since they can't be statically validated.
 */

import type { KnownRunner, Workflow } from '../../schema/index.js';
import type { Rule, ValidationError } from '../errors.js';

const RULE = 'runners';

const KNOWN_RUNNERS: readonly KnownRunner[] = [
  'ubuntu-latest',
  'ubuntu-24.04',
  'ubuntu-22.04',
  'ubuntu-24.04-arm',
  'ubuntu-22.04-arm',
  'windows-latest',
  'windows-2022',
  'windows-2025',
  'windows-11-arm',
  'macos-latest',
  'macos-15',
  'macos-14',
  'macos-13',
] as const;

const KNOWN = new Set<string>(KNOWN_RUNNERS);

function warning(jobId: string, value: string): ValidationError {
  return {
    path: ['jobs', jobId, 'runs-on'],
    message: `Unknown runner label '${value}'`,
    severity: 'warning',
    rule: RULE,
  };
}

export const runnersRule: Rule = (workflow: Workflow) => {
  const errors: ValidationError[] = [];

  if (workflow.jobs === undefined || workflow.jobs === null) {
    return errors;
  }

  for (const [jobId, job] of Object.entries(workflow.jobs)) {
    // Skip ReusableJob.
    if (!('runs-on' in job) || job['runs-on'] === undefined) continue;

    const runsOn: unknown = job['runs-on'];

    if (typeof runsOn === 'string') {
      if (runsOn.includes('${{')) continue;
      if (runsOn === 'self-hosted' || runsOn.startsWith('self-hosted')) continue;
      if (KNOWN.has(runsOn)) continue;
      errors.push(warning(jobId, runsOn));
      continue;
    }

    if (Array.isArray(runsOn)) {
      const stringElements = runsOn.filter((el): el is string => typeof el === 'string');
      if (stringElements.includes('self-hosted')) continue;
      const hasKnown = stringElements.some((el) => KNOWN.has(el));
      if (!hasKnown) {
        errors.push(warning(jobId, stringElements.join(', ')));
      }
      continue;
    }

    // Object form ({ group, labels }) — skip.
  }

  return errors;
};
