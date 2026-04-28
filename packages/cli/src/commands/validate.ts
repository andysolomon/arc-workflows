/// <reference types="node" />
import { readFile } from 'node:fs/promises';
import { formatPath, parse, validate, ParseError } from '@arc-workflows/core';

/**
 * Validate a GitHub Actions workflow YAML file.
 *
 * @returns Exit code: 0 valid, 1 invalid, 2 parse error or IO failure.
 */
export async function runValidate(filePath: string): Promise<number> {
  let yaml: string;
  try {
    yaml = await readFile(filePath, 'utf8');
  } catch (err) {
    console.error(`Could not read ${filePath}: ${errMsg(err)}`);
    return 2;
  }

  let workflow;
  try {
    workflow = parse(yaml);
  } catch (err) {
    if (err instanceof ParseError) {
      console.error(`Parse error: ${err.message}`);
      return 2;
    }
    console.error(`Unexpected error: ${errMsg(err)}`);
    return 2;
  }

  const result = validate(workflow);
  if (result.valid) {
    console.log(`✓ ${filePath} is valid`);
    return 0;
  }

  console.error(`✗ ${filePath} has ${result.errors.length} error(s):`);
  for (const err of result.errors) {
    console.error(`  [${err.severity}] ${formatPath(err.path)}: ${err.message}`);
  }
  return 1;
}

function errMsg(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}
