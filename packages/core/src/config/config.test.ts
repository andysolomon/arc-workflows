import { mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import { loadConfig } from './config.js';

async function makeTempDir(): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), 'arc-config-test-'));
  // Mark as a fake repo root so the walk-up stops here and doesn't
  // escape into the real repo (which may have its own config).
  await mkdir(join(dir, '.git'));
  return dir;
}

describe('loadConfig', () => {
  const tempDirs: string[] = [];

  async function createTemp(): Promise<string> {
    const dir = await makeTempDir();
    tempDirs.push(dir);
    return dir;
  }

  afterEach(() => {
    // Temp dirs are left for OS cleanup; tmpdir purges them eventually.
    tempDirs.length = 0;
  });

  it('returns empty config when no file is found', async () => {
    const dir = await createTemp();
    const result = await loadConfig({ cwd: dir });
    expect(result).toEqual({ config: {}, source: null });
  });

  it('loads a .arc-workflows.yml file', async () => {
    const dir = await createTemp();
    const file = join(dir, '.arc-workflows.yml');
    await writeFile(file, 'defaultRunner: ubuntu-24.04\ndefaultBranch: main\n');
    const result = await loadConfig({ cwd: dir });
    expect(result.source).toBe(file);
    expect(result.config.defaultRunner).toBe('ubuntu-24.04');
    expect(result.config.defaultBranch).toBe('main');
  });

  it('loads a .arc-workflows.json file', async () => {
    const dir = await createTemp();
    const file = join(dir, '.arc-workflows.json');
    await writeFile(file, JSON.stringify({ nodeVersion: '20' }));
    const result = await loadConfig({ cwd: dir });
    expect(result.source).toBe(file);
    expect(result.config.nodeVersion).toBe('20');
  });

  it('loads a .arc-workflows.yaml file', async () => {
    const dir = await createTemp();
    const file = join(dir, '.arc-workflows.yaml');
    await writeFile(file, 'pythonVersion: "3.12"\n');
    const result = await loadConfig({ cwd: dir });
    expect(result.source).toBe(file);
    expect(result.config.pythonVersion).toBe('3.12');
  });

  it('walks up from a child directory and finds the nearest config', async () => {
    const dir = await createTemp();
    const sub = join(dir, 'sub');
    const deeper = join(sub, 'deeper');
    await mkdir(deeper, { recursive: true });

    // Config in the root tempDir
    await writeFile(join(dir, '.arc-workflows.yml'), 'defaultBranch: root\n');
    // Closer config in the intermediate sub dir — this should win
    const subFile = join(sub, '.arc-workflows.yml');
    await writeFile(subFile, 'defaultBranch: sub\n');

    const result = await loadConfig({ cwd: deeper });
    expect(result.source).toBe(subFile);
    expect(result.config.defaultBranch).toBe('sub');
  });

  it('stops walking up at a .git directory', async () => {
    const dir = await createTemp();
    const sub = join(dir, 'sub');
    await mkdir(sub);
    // Make sub its own fake repo root
    await mkdir(join(sub, '.git'));
    // Config in the parent should NOT be reached
    await writeFile(join(dir, '.arc-workflows.yml'), 'defaultBranch: parent\n');

    const result = await loadConfig({ cwd: sub });
    expect(result).toEqual({ config: {}, source: null });
  });

  it('prefers .yml over .json in the same directory', async () => {
    const dir = await createTemp();
    const yml = join(dir, '.arc-workflows.yml');
    await writeFile(yml, 'defaultBranch: yml-wins\n');
    await writeFile(join(dir, '.arc-workflows.json'), JSON.stringify({ defaultBranch: 'json' }));

    const result = await loadConfig({ cwd: dir });
    expect(result.source).toBe(yml);
    expect(result.config.defaultBranch).toBe('yml-wins');
  });

  it('prefers .yaml over .json when .yml is absent', async () => {
    const dir = await createTemp();
    const yaml = join(dir, '.arc-workflows.yaml');
    await writeFile(yaml, 'defaultBranch: yaml-wins\n');
    await writeFile(join(dir, '.arc-workflows.json'), JSON.stringify({ defaultBranch: 'json' }));

    const result = await loadConfig({ cwd: dir });
    expect(result.source).toBe(yaml);
    expect(result.config.defaultBranch).toBe('yaml-wins');
  });

  it('throws with the file path when YAML is malformed', async () => {
    const dir = await createTemp();
    const file = join(dir, '.arc-workflows.yml');
    // Unbalanced bracket → YAML parse error
    await writeFile(file, 'defaultRunner: [ubuntu\n');
    await expect(loadConfig({ cwd: dir })).rejects.toThrow(file);
  });

  it('throws when the parsed config fails validation', async () => {
    const dir = await createTemp();
    const file = join(dir, '.arc-workflows.yml');
    await writeFile(file, 'defaultRunner: 42\n');
    await expect(loadConfig({ cwd: dir })).rejects.toThrow(/defaultRunner/);
  });
});
