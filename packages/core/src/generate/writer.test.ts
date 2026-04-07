/// <reference types="node" />
import { mkdtemp, readFile, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import type { Workflow } from '../schema/index.js';

import { defaultPath, writeWorkflow } from './writer.js';

const FIXTURE: Workflow = {
  name: 'CI',
  on: { push: { branches: ['main'] } },
  jobs: {
    build: {
      'runs-on': 'ubuntu-latest',
      steps: [{ uses: 'actions/checkout@v4' }],
    },
  },
};

describe('writeWorkflow', () => {
  let tmp: string;

  beforeEach(async () => {
    tmp = await mkdtemp(join(tmpdir(), 'arc-workflows-writer-'));
  });

  afterEach(async () => {
    await rm(tmp, { recursive: true, force: true });
  });

  it('writes YAML to an explicit path', async () => {
    const target = join(tmp, 'nested', 'ci.yml');
    await writeWorkflow(FIXTURE, target);
    const content = await readFile(target, 'utf8');
    expect(content).toContain('name: CI');
    expect(content).toContain('runs-on: ubuntu-latest');
    expect(content).toContain('uses: actions/checkout@v4');
  });

  it('creates parent directories that do not exist', async () => {
    const target = join(tmp, 'a', 'b', 'c', 'wf.yml');
    await writeWorkflow(FIXTURE, target);
    expect((await stat(target)).isFile()).toBe(true);
  });
});

describe('defaultPath', () => {
  it('slugs the workflow name into .github/workflows', () => {
    expect(defaultPath({ name: 'CI Build', on: { push: {} }, jobs: {} })).toBe(
      join('.github', 'workflows', 'ci-build.yml'),
    );
  });

  it('strips non-alphanumeric and collapses dashes', () => {
    expect(defaultPath({ name: '  Deploy to Prod!!  ', on: { push: {} }, jobs: {} })).toBe(
      join('.github', 'workflows', 'deploy-to-prod.yml'),
    );
  });

  it('falls back to workflow.yml when name is missing', () => {
    expect(defaultPath({ on: { push: {} }, jobs: {} })).toBe(
      join('.github', 'workflows', 'workflow.yml'),
    );
  });

  it('falls back when slug is empty', () => {
    expect(defaultPath({ name: '!!!', on: { push: {} }, jobs: {} })).toBe(
      join('.github', 'workflows', 'workflow.yml'),
    );
  });
});
