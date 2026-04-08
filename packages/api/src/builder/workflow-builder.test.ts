/// <reference types="node" />

import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { generate, validate } from '@arc-workflows/core';
import { describe, expect, it } from 'vitest';

import { job } from './job-builder.js';
import { step } from './step-builder.js';
import { workflow, WorkflowBuilder } from './workflow-builder.js';

describe('WorkflowBuilder', () => {
  it('throws on .toJSON() when no triggers configured', () => {
    const wf = new WorkflowBuilder('CI');
    expect(() => wf.toJSON()).toThrow(/at least one trigger/);
  });

  it('throws on .toJSON() when no jobs configured', () => {
    const wf = workflow('CI').on('push', { branches: ['main'] });
    expect(() => wf.toJSON()).toThrow(/at least one job/);
  });

  it('builds a minimal valid workflow', () => {
    const wf = workflow('CI')
      .on('push', { branches: ['main'] })
      .job(job('build').runsOn('ubuntu-latest').step(step().run('echo hi')))
      .toJSON();

    expect(wf.name).toBe('CI');
    expect(wf.on).toEqual({ push: { branches: ['main'] } });
    expect(Object.keys(wf.jobs)).toEqual(['build']);
  });

  it('passes core validation', () => {
    const wf = workflow('CI')
      .on('push', { branches: ['main'] })
      .job(job('build').runsOn('ubuntu-latest').step(step().run('echo hi')));

    const result = wf.validate();
    const errors = result.errors.filter((e) => e.severity === 'error');
    expect(errors).toEqual([]);
  });

  it('toYAML() output matches generate(toJSON())', () => {
    const wf = workflow('CI')
      .on('push', { branches: ['main'] })
      .job(job('build').runsOn('ubuntu-latest').step(step().run('echo hi')));

    expect(wf.toYAML()).toBe(generate(wf.toJSON()));
  });

  it('writeTo() writes the YAML to disk', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'arc-wf-builder-'));
    const filePath = join(dir, 'ci.yml');
    const wf = workflow('CI')
      .on('push', { branches: ['main'] })
      .job(job('build').runsOn('ubuntu-latest').step(step().run('echo hi')));
    await wf.writeTo(filePath);
    const yaml = await readFile(filePath, 'utf8');
    expect(yaml).toBe(wf.toYAML());
  });

  it('supports permissions/env/defaults/concurrency/runName', () => {
    const wf = workflow('CI')
      .runName('CI run')
      .on('push', { branches: ['main'] })
      .permissions({ contents: 'read' })
      .env({ NODE_ENV: 'test' })
      .defaults({ run: { shell: 'bash' } })
      .concurrency('group-1')
      .job(job('build').runsOn('ubuntu-latest').step(step().run('echo hi')))
      .toJSON();

    expect(wf['run-name']).toBe('CI run');
    expect(wf.permissions).toEqual({ contents: 'read' });
    expect(wf.env).toEqual({ NODE_ENV: 'test' });
    expect(wf.defaults).toEqual({ run: { shell: 'bash' } });
    expect(wf.concurrency).toBe('group-1');
  });

  it('.on() with no config sets a null trigger value', () => {
    const wf = workflow('M')
      .on('workflow_dispatch')
      .job(job('build').runsOn('ubuntu-latest').step(step().run('echo hi')))
      .toJSON();
    expect(wf.on.workflow_dispatch).toBeNull();
  });

  it('passes core validate() without errors for the canonical example', () => {
    const wf = workflow('CI')
      .on('pull_request', { branches: ['main'] })
      .job(
        job('build')
          .runsOn('ubuntu-latest')
          .step(step().uses('actions/checkout@v4'))
          .step(step().run('npm test')),
      )
      .toJSON();

    const result = validate(wf);
    expect(result.errors.filter((e) => e.severity === 'error')).toEqual([]);
  });
});
