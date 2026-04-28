/// <reference types="node" />
import { readFile, writeFile } from 'node:fs/promises';
import { generate, validate, type Workflow } from '@arc-workflows/core';

/**
 * Generate YAML from a workflow JSON file.
 *
 * @returns Exit code: 0 success, 1 validation failed, 2 parse/IO error.
 */
export async function runGenerate(filePath: string, opts: { output?: string }): Promise<number> {
  let json: string;
  try {
    json = await readFile(filePath, 'utf8');
  } catch (err) {
    console.error(`Could not read ${filePath}: ${errMsg(err)}`);
    return 2;
  }

  let workflow: Workflow;
  try {
    workflow = JSON.parse(json) as Workflow;
  } catch (err) {
    console.error(`Invalid JSON in ${filePath}: ${errMsg(err)}`);
    return 2;
  }

  const result = validate(workflow);
  if (!result.valid) {
    console.error('✗ Workflow failed validation:');
    for (const err of result.errors.filter((e) => e.severity === 'error')) {
      console.error(`  ${err.message}`);
    }
    return 1;
  }

  const yaml = generate(workflow);
  if (opts.output) {
    try {
      await writeFile(opts.output, yaml, 'utf8');
    } catch (err) {
      console.error(`Could not write ${opts.output}: ${errMsg(err)}`);
      return 2;
    }
    console.log(`✓ Wrote ${opts.output}`);
  } else {
    process.stdout.write(yaml);
  }
  return 0;
}

function errMsg(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}
