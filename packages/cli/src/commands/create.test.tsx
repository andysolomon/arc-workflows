/// <reference types="node" />
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { Workflow } from '@arc-workflows/core';
import { createTestActor } from '../wizard/context.js';
import { runCreate } from './create.js';

describe('runCreate — E2E happy path', () => {
  let dir: string;

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), 'arc-create-'));
  });

  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
    vi.restoreAllMocks();
  });

  it('walks welcome → confirm → done and writes the workflow file', async () => {
    const actor = createTestActor();
    const outputPath = join(dir, 'ci.yml');

    const writes: { workflow: Workflow; path: string | undefined }[] = [];
    const writer = vi.fn((workflow: Workflow, path?: string) => {
      writes.push({ workflow, path });
      return Promise.resolve();
    });

    const exitPromise = runCreate({ actor, renderToTerminal: false, writer });

    // Walk through the wizard programmatically.
    expect(actor.getSnapshot().value).toBe('welcome');
    actor.send({ type: 'SELECT_CREATE' });
    expect(actor.getSnapshot().value).toBe('templateSelect');

    actor.send({ type: 'SELECT_TEMPLATE', templateId: 'ci-node' });
    expect(actor.getSnapshot().value).toBe('workflowName');

    actor.send({ type: 'SET_NAME', name: 'CI' });
    actor.send({ type: 'NEXT' });
    expect(actor.getSnapshot().value).toBe('triggers');

    actor.send({ type: 'CONFIGURE_TRIGGERS', triggers: { push: {} } });
    actor.send({ type: 'NEXT' });
    expect(actor.getSnapshot().value).toBe('jobs');

    actor.send({
      type: 'ADD_JOB',
      id: 'build',
      job: {
        'runs-on': 'ubuntu-latest',
        steps: [{ run: 'echo hello' }],
      },
    });
    actor.send({ type: 'NEXT' });
    expect(actor.getSnapshot().value).toBe('confirm');

    actor.send({ type: 'CONFIRM', outputPath });

    const exit = await exitPromise;

    expect(exit).toBe(0);
    expect(actor.getSnapshot().status).toBe('done');
    expect(actor.getSnapshot().context.outputPath).toBe(outputPath);
    expect(writer).toHaveBeenCalledTimes(1);
    expect(writes).toHaveLength(1);
    expect(writes[0]?.path).toBe(outputPath);
    expect(writes[0]?.workflow.name).toBe('CI');
    expect(writes[0]?.workflow.jobs?.build).toBeDefined();

    actor.stop();
  });

  it('writes to the default path when outputPath is empty/undefined', async () => {
    const actor = createTestActor();
    const writer = vi.fn(() => Promise.resolve());

    actor.send({ type: 'SELECT_CREATE' });
    actor.send({ type: 'SELECT_BLANK' });
    actor.send({ type: 'SET_NAME', name: 'Quick' });
    actor.send({ type: 'NEXT' });
    actor.send({ type: 'NEXT' });
    actor.send({
      type: 'ADD_JOB',
      id: 'noop',
      job: { 'runs-on': 'ubuntu-latest', steps: [{ run: 'echo' }] },
    });
    actor.send({ type: 'NEXT' });

    const exitPromise = runCreate({ actor, renderToTerminal: false, writer });
    actor.send({ type: 'CONFIRM', outputPath: '' });
    const exit = await exitPromise;

    expect(exit).toBe(0);
    expect(writer).toHaveBeenCalledTimes(1);
    const [, pathArg] = writer.mock.calls[0] ?? [];
    expect(pathArg).toBeUndefined();

    actor.stop();
  });

  it('resolves with 2 when the writer throws', async () => {
    const actor = createTestActor();
    const writer = vi.fn(() => Promise.reject(new Error('disk full')));
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    actor.send({ type: 'SELECT_CREATE' });
    actor.send({ type: 'SELECT_BLANK' });
    actor.send({ type: 'SET_NAME', name: 'Fail' });
    actor.send({ type: 'NEXT' });
    actor.send({ type: 'NEXT' });
    actor.send({
      type: 'ADD_JOB',
      id: 'j',
      job: { 'runs-on': 'ubuntu-latest', steps: [{ run: 'echo' }] },
    });
    actor.send({ type: 'NEXT' });

    const exitPromise = runCreate({ actor, renderToTerminal: false, writer });
    actor.send({ type: 'CONFIRM', outputPath: '/tmp/fail.yml' });
    const exit = await exitPromise;
    expect(exit).toBe(2);
    expect(errSpy).toHaveBeenCalled();
    actor.stop();
  });

  it('writes the correct workflow when using the real writeWorkflow call', async () => {
    const actor = createTestActor();
    const outputPath = join(dir, 'ci-real.yml');

    actor.send({ type: 'SELECT_CREATE' });
    actor.send({ type: 'SELECT_BLANK' });
    actor.send({ type: 'SET_NAME', name: 'CI Real' });
    actor.send({ type: 'NEXT' });
    actor.send({ type: 'CONFIGURE_TRIGGERS', triggers: { push: {} } });
    actor.send({ type: 'NEXT' });
    actor.send({
      type: 'ADD_JOB',
      id: 'build',
      job: {
        'runs-on': 'ubuntu-latest',
        steps: [{ run: 'echo integration' }],
      },
    });
    actor.send({ type: 'NEXT' });

    const exitPromise = runCreate({ actor, renderToTerminal: false });
    actor.send({ type: 'CONFIRM', outputPath });
    const exit = await exitPromise;

    expect(exit).toBe(0);
    const yaml = await readFile(outputPath, 'utf8');
    expect(yaml).toContain('name: CI Real');
    expect(yaml).toContain('build:');
    expect(yaml).toContain('echo integration');
    actor.stop();
  });
});
