/// <reference types="node" />
import { readFile } from 'node:fs/promises';
import { render } from 'ink';
import { createActor } from 'xstate';
import {
  parse,
  validate,
  writeWorkflow,
  formatPath,
  ParseError,
  type Workflow,
} from '@arc-workflows/core';
import { wizardMachine } from '../wizard/machine.js';
import { TestWizardProvider, type WizardActor } from '../wizard/context.js';
import { Layout } from '../components/layout.js';
import { WizardRouter } from '../app.js';

export interface RunEditOptions {
  /**
   * Optional pre-built actor (typically `createActor(wizardMachine,
   * { input: ... })` already started) used by tests to drive the
   * wizard programmatically.
   */
  actor?: WizardActor;
  /**
   * When `true` (the default), render the wizard to the real terminal.
   * Tests pass `false` to drive the actor directly without mounting Ink.
   */
  renderToTerminal?: boolean;
  /**
   * Override the write sink (used by tests that want to assert the
   * call without touching the filesystem). Defaults to `writeWorkflow`.
   */
  writer?: (workflow: Workflow, outputPath?: string) => Promise<void>;
  /** Optional signal to abort the wizard from the caller (tests). */
  signal?: AbortSignal;
}

/**
 * Load an existing workflow YAML file, hydrate the wizard, and write
 * the result back when the user confirms.
 *
 * Exit codes:
 *  - 0: file written successfully
 *  - 2: read error, parse error, or write error
 *  - 130: user cancelled (SIGINT)
 *
 * Validation errors are printed to stderr but do NOT abort the wizard
 * — the user can fix the workflow interactively.
 */
export async function runEdit(filePath: string, opts: RunEditOptions = {}): Promise<number> {
  let actor = opts.actor;

  // When no actor was injected, perform the full read → parse → validate
  // → createActor pipeline. Tests typically inject a pre-built actor and
  // skip this branch.
  if (!actor) {
    let yaml: string;
    try {
      yaml = await readFile(filePath, 'utf8');
    } catch (err) {
      console.error(`Could not read ${filePath}: ${msg(err)}`);
      return 2;
    }

    let workflow: Workflow;
    try {
      workflow = parse(yaml);
    } catch (err) {
      if (err instanceof ParseError) {
        console.error(`Parse error: ${err.message}`);
      } else {
        console.error(`Unexpected error: ${msg(err)}`);
      }
      return 2;
    }

    const result = validate(workflow);
    if (!result.valid) {
      console.error(`Warning: ${filePath} has ${result.errors.length} validation issue(s):`);
      for (const e of result.errors) {
        console.error(`  [${e.severity}] ${formatPath(e.path)}: ${e.message}`);
      }
      console.error('');
    }

    actor = createActor(wizardMachine, { input: { workflow, sourcePath: filePath } });
    actor.start();
  }

  const shouldRender = opts.renderToTerminal !== false;
  const ink = shouldRender
    ? render(
        <TestWizardProvider actor={actor}>
          <Layout>
            <WizardRouter />
          </Layout>
        </TestWizardProvider>,
      )
    : null;

  const writer = opts.writer ?? writeWorkflow;
  const boundActor = actor;

  return new Promise<number>((resolve) => {
    let settled = false;
    const finish = (code: number): void => {
      if (settled) return;
      settled = true;
      sub.unsubscribe();
      process.off('SIGINT', onSigInt);
      if (opts.signal) opts.signal.removeEventListener('abort', onAbort);
      ink?.unmount();
      resolve(code);
    };

    const sub = boundActor.subscribe((snap) => {
      const value = typeof snap.value === 'string' ? snap.value : '';
      if (snap.status === 'done' || value === 'done') {
        const wf = snap.context.workflow as Workflow;
        const outputPath = snap.context.outputPath ?? filePath;
        void writer(wf, outputPath).then(
          () => finish(0),
          (err: unknown) => {
            console.error(msg(err));
            finish(2);
          },
        );
      }
    });

    const onSigInt = (): void => finish(130);
    process.once('SIGINT', onSigInt);

    const onAbort = (): void => finish(130);
    if (opts.signal) opts.signal.addEventListener('abort', onAbort);
  });
}

function msg(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}
