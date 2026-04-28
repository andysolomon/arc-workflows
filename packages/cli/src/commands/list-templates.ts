import { listTemplates } from '@arc-workflows/core';

/**
 * Print the list of built-in templates to stdout.
 *
 * @returns Exit code 0.
 */
export function runListTemplates(): number {
  const templates = listTemplates();
  console.log('Available templates:\n');
  for (const t of templates) {
    console.log(`  ${t.id.padEnd(20)} ${t.name}`);
    console.log(`  ${' '.repeat(20)} ${t.description}`);
    console.log(`  ${' '.repeat(20)} [${t.tags.join(', ')}]\n`);
  }
  return 0;
}
