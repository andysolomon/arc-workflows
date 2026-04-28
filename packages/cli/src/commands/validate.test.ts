/// <reference types="node" />
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { runValidate } from './validate.js';

describe('runValidate', () => {
  let dir: string;

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), 'arc-validate-'));
  });

  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
    vi.restoreAllMocks();
  });

  it('returns 0 for a valid workflow YAML', async () => {
    const file = join(dir, 'valid.yml');
    await writeFile(
      file,
      [
        'name: CI',
        'on: push',
        'jobs:',
        '  build:',
        '    runs-on: ubuntu-latest',
        '    steps:',
        '      - run: echo hello',
      ].join('\n'),
      'utf8',
    );
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    const exit = await runValidate(file);
    expect(exit).toBe(0);
    expect(log.mock.calls.some((c) => String(c[0]).includes('is valid'))).toBe(true);
  });

  it('returns 1 for a workflow that fails validation', async () => {
    const file = join(dir, 'invalid.yml');
    // Missing `on` + empty jobs → validate() reports errors.
    await writeFile(file, 'name: Broken\njobs: {}\n', 'utf8');
    const err = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const exit = await runValidate(file);
    expect(exit).toBe(1);
    expect(err).toHaveBeenCalled();
  });

  it('returns 2 for malformed YAML (parse error)', async () => {
    const file = join(dir, 'malformed.yml');
    // Top-level scalar is not a valid workflow.
    await writeFile(file, 'just-a-string\n', 'utf8');
    const err = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const exit = await runValidate(file);
    expect(exit).toBe(2);
    expect(err.mock.calls.some((c) => String(c[0]).toLowerCase().includes('parse'))).toBe(true);
  });

  it('returns 2 when the file does not exist', async () => {
    const err = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const exit = await runValidate(join(dir, 'nope.yml'));
    expect(exit).toBe(2);
    expect(err).toHaveBeenCalled();
  });
});
