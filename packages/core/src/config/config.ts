/**
 * Async loader for the user-supplied `.arc-workflows` config file.
 *
 * Walks up from the starting directory until it finds a config file or
 * hits a `.git` directory or filesystem root. Supports `.yml`, `.yaml`,
 * and `.json` extensions in that precedence order within a single dir.
 */

import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { dirname, join, parse as parsePath, resolve } from 'node:path';

import { parse as parseYaml } from 'yaml';

import type { ArcConfig, LoadConfigOptions, LoadConfigResult } from './types.js';
import { validateConfig } from './validate-config.js';

const CONFIG_FILES = ['.arc-workflows.yml', '.arc-workflows.yaml', '.arc-workflows.json'] as const;

export async function loadConfig(options: LoadConfigOptions = {}): Promise<LoadConfigResult> {
  const startDir = resolve(options.cwd ?? process.cwd());
  const found = findConfigFile(startDir);
  if (!found) {
    return { config: {}, source: null };
  }

  const content = await readFile(found, 'utf8');
  let parsed: unknown;
  try {
    if (found.endsWith('.json')) {
      parsed = JSON.parse(content);
    } else {
      // .yml or .yaml
      parsed = parseYaml(content);
    }
  } catch (err) {
    throw new Error(
      `Failed to parse config file at ${found}: ${err instanceof Error ? err.message : String(err)}`,
      { cause: err },
    );
  }

  const result = validateConfig(parsed);
  if (!result.valid) {
    const errorMessages = result.errors
      .filter((e) => e.severity === 'error')
      .map((e) => `  - ${e.path.join('.')}: ${e.message}`)
      .join('\n');
    throw new Error(`Invalid config file at ${found}:\n${errorMessages}`);
  }

  return {
    config: (parsed ?? {}) as ArcConfig,
    source: found,
  };
}

function findConfigFile(startDir: string): string | null {
  let dir = startDir;
  const root = parsePath(dir).root;

  while (true) {
    for (const filename of CONFIG_FILES) {
      const candidate = join(dir, filename);
      if (existsSync(candidate)) {
        return candidate;
      }
    }
    // Stop at git repo root
    if (existsSync(join(dir, '.git'))) {
      return null;
    }
    // Stop at filesystem root
    if (dir === root) {
      return null;
    }
    dir = dirname(dir);
  }
}
