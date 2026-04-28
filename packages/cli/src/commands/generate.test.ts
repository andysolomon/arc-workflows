/// <reference types="node" />
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { runGenerate } from './generate.js';

describe('runGenerate', () => {
  let dir: string;

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), 'arc-generate-'));
  });

  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
    vi.restoreAllMocks();
  });

  it('returns 0 and writes YAML for a valid workflow JSON', async () => {
    const input = join(dir, 'wf.json');
    const output = join(dir, 'wf.yml');
    await writeFile(
      input,
      JSON.stringify({
        name: 'CI',
        on: { push: {} },
        jobs: {
          build: {
            'runs-on': 'ubuntu-latest',
            steps: [{ run: 'echo hello' }],
          },
        },
      }),
      'utf8',
    );
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    const exit = await runGenerate(input, { output });
    expect(exit).toBe(0);
    expect(log.mock.calls.some((c) => String(c[0]).includes('Wrote'))).toBe(true);
    const yaml = await readFile(output, 'utf8');
    expect(yaml).toContain('name: CI');
    expect(yaml).toContain('jobs:');
    expect(yaml).toContain('build:');
  });

  it('writes YAML to stdout when no --output is provided', async () => {
    const input = join(dir, 'wf.json');
    await writeFile(
      input,
      JSON.stringify({
        name: 'CI',
        on: { push: {} },
        jobs: {
          build: { 'runs-on': 'ubuntu-latest', steps: [{ run: 'echo hi' }] },
        },
      }),
      'utf8',
    );
    const chunks: string[] = [];
    const write = vi
      .spyOn(process.stdout, 'write')
      .mockImplementation((chunk: string | Uint8Array) => {
        chunks.push(typeof chunk === 'string' ? chunk : Buffer.from(chunk).toString('utf8'));
        return true;
      });
    const exit = await runGenerate(input, {});
    expect(exit).toBe(0);
    expect(write).toHaveBeenCalled();
    expect(chunks.join('')).toContain('name: CI');
  });

  it('returns 1 for a workflow that fails validation', async () => {
    const input = join(dir, 'bad.json');
    // Empty jobs triggers a validation error.
    await writeFile(input, JSON.stringify({ name: 'Bad', on: { push: {} }, jobs: {} }), 'utf8');
    const err = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const exit = await runGenerate(input, {});
    expect(exit).toBe(1);
    expect(err).toHaveBeenCalled();
  });

  it('returns 2 for malformed JSON', async () => {
    const input = join(dir, 'not-json.json');
    await writeFile(input, '{ this is not json', 'utf8');
    const err = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const exit = await runGenerate(input, {});
    expect(exit).toBe(2);
    expect(err.mock.calls.some((c) => String(c[0]).toLowerCase().includes('invalid json'))).toBe(
      true,
    );
  });

  it('returns 2 when the input file does not exist', async () => {
    const err = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const exit = await runGenerate(join(dir, 'nope.json'), {});
    expect(exit).toBe(2);
    expect(err).toHaveBeenCalled();
  });
});
