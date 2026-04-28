/// <reference types="node" />
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mkdtemp, readFile, rm, writeFile, copyFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
import { createActor } from 'xstate';
import { parse } from '@arc-workflows/core';
import { wizardMachine } from '../wizard/machine.js';
import { runEdit } from './edit.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const FIXTURES = resolve(__dirname, '../../test/fixtures/edit');

async function actorFromFile(filePath: string) {
  const yaml = await readFile(filePath, 'utf8');
  const workflow = parse(yaml);
  const actor = createActor(wizardMachine, {
    input: { workflow, sourcePath: filePath },
  });
  actor.start();
  return actor;
}

describe('runEdit — integration', () => {
  let dir: string;

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), 'arc-edit-'));
  });

  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
    vi.restoreAllMocks();
  });

  it('hydrates context with expected jobs from complex.yml', async () => {
    const actor = await actorFromFile(join(FIXTURES, 'complex.yml'));
    const snap = actor.getSnapshot();
    expect(snap.value).toBe('jobs');
    const jobs = snap.context.workflow.jobs ?? {};
    expect(Object.keys(jobs)).toEqual(['lint', 'test', 'deploy']);
    expect(snap.context.outputPath).toBe(join(FIXTURES, 'complex.yml'));
    actor.stop();
  });

  it('normalizes `on: push` shorthand to object form when loading shorthand.yml', async () => {
    const actor = await actorFromFile(join(FIXTURES, 'shorthand.yml'));
    const snap = actor.getSnapshot();
    expect(snap.context.workflow.on).toEqual({ push: {} });
    actor.stop();
  });

  it('mutates and writes back: ADD_JOB → CONFIRM persists the new job', async () => {
    // Copy the fixture to a temp file so we don't dirty the source.
    const tempPath = join(dir, 'complex.yml');
    await copyFile(join(FIXTURES, 'complex.yml'), tempPath);

    const actor = await actorFromFile(tempPath);

    const exitPromise = runEdit(tempPath, { actor, renderToTerminal: false });

    expect(actor.getSnapshot().value).toBe('jobs');
    actor.send({
      type: 'ADD_JOB',
      id: 'extra',
      job: {
        'runs-on': 'ubuntu-latest',
        steps: [{ run: 'echo extra' }],
      },
    });
    actor.send({ type: 'NEXT' }); // -> confirm
    actor.send({ type: 'CONFIRM', outputPath: tempPath });

    const exit = await exitPromise;
    expect(exit).toBe(0);

    const yaml = await readFile(tempPath, 'utf8');
    expect(yaml).toContain('extra:');
    expect(yaml).toContain('echo extra');

    // Round-trip the rewritten file: re-parse and confirm shape.
    const reparsed = parse(yaml);
    expect(Object.keys(reparsed.jobs ?? {})).toContain('extra');

    actor.stop();
  });

  it('returns exit code 2 when the file is unparseable', async () => {
    const broken = join(dir, 'broken.yml');
    await writeFile(broken, '{ broken yaml :::', 'utf8');
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    const exit = await runEdit(broken, { renderToTerminal: false });
    expect(exit).toBe(2);
    expect(errSpy).toHaveBeenCalled();
  });

  it('strips comments on save (documents the round-trip caveat)', async () => {
    const tempPath = join(dir, 'commented.yml');
    await copyFile(join(FIXTURES, 'commented.yml'), tempPath);

    // Sanity: source has comments.
    const before = await readFile(tempPath, 'utf8');
    expect(before).toContain('# This is a CI workflow');
    expect(before).toContain('# only main');

    const actor = await actorFromFile(tempPath);
    const exitPromise = runEdit(tempPath, { actor, renderToTerminal: false });

    expect(actor.getSnapshot().value).toBe('jobs');
    actor.send({ type: 'NEXT' }); // -> confirm
    actor.send({ type: 'CONFIRM', outputPath: tempPath });

    const exit = await exitPromise;
    expect(exit).toBe(0);

    const after = await readFile(tempPath, 'utf8');
    expect(after).not.toContain('#');

    actor.stop();
  });
});
