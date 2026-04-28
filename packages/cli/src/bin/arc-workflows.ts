#!/usr/bin/env node
/// <reference types="node" />
import { Command } from 'commander';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { runCreate } from '../commands/create.js';
import { runValidate } from '../commands/validate.js';
import { runListTemplates } from '../commands/list-templates.js';
import { runGenerate } from '../commands/generate.js';

const pkgPath = join(dirname(fileURLToPath(import.meta.url)), '../../package.json');
const pkg = JSON.parse(await readFile(pkgPath, 'utf8')) as { version: string };

const program = new Command();
program
  .name('arc-workflows')
  .description('Build GitHub Actions workflows with confidence.')
  .version(pkg.version);

program
  .command('create', { isDefault: true })
  .description('Launch the interactive wizard to create a workflow.')
  .option('--template <id>', 'Pre-load a template by id')
  .action(async (opts: { template?: string }) => {
    const code = await runCreate(opts);
    process.exit(code);
  });

program
  .command('validate <file>')
  .description('Validate a GitHub Actions workflow YAML file.')
  .action(async (file: string) => {
    const code = await runValidate(file);
    process.exit(code);
  });

program
  .command('list-templates')
  .description('List all built-in workflow templates.')
  .action(() => {
    const code = runListTemplates();
    process.exit(code);
  });

program
  .command('generate <file>')
  .description('Generate YAML from a workflow JSON file.')
  .option('-o, --output <path>', 'Output path (default: print to stdout)')
  .action(async (file: string, opts: { output?: string }) => {
    const code = await runGenerate(file, opts);
    process.exit(code);
  });

await program.parseAsync();
