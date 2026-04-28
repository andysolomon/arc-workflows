/// <reference types="node" />
import { render } from 'ink';
import { createActor } from 'xstate';
import { writeWorkflow, type Workflow } from '@arc-workflows/core';
import { wizardMachine } from '../wizard/machine.js';
import { TestWizardProvider, type WizardActor } from '../wizard/context.js';
import { Layout } from '../components/layout.js';
import { WizardRouter } from '../app.js';

export interface RunCreateOptions {
  template?: string;
  /**
   * Optional actor injection point — lets programmatic tests provide
   * their own pre-configured actor so they can dispatch events and
   * observe completion without spawning a subprocess.
   */
  actor?: WizardActor;
  /**
   * When `true` (the default), render the wizard to the real terminal.
   * Set to `false` in unit/E2E tests that drive the actor directly and
   * do not need Ink to mount.
   */
  renderToTerminal?: boolean;
  /**
   * Override the write sink (used by tests that want to assert the call
   * without touching the filesystem). Defaults to `writeWorkflow`.
   */
  writer?: (workflow: Workflow, outputPath?: string) => Promise<void>;
  /** Optional signal to abort the wizard from the caller (tests). */
  signal?: AbortSignal;
}

/**
 * Run the interactive create wizard.
 *
 * The binary calls this with no options; tests can pass `actor` and
 * `renderToTerminal: false` to drive the machine programmatically and
 * observe `done` without mounting Ink.
 *
 * @returns Exit code: 0 success, 2 unhandled write error, 130 SIGINT.
 */
export async function runCreate(opts: RunCreateOptions = {}): Promise<number> {
  const actor = opts.actor ?? createActor(wizardMachine);
  if (!opts.actor) {
    actor.start();
  }
  if (opts.template) {
    actor.send({ type: 'SELECT_CREATE' });
    actor.send({ type: 'SELECT_TEMPLATE', templateId: opts.template });
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

    const sub = actor.subscribe((snap) => {
      const value = typeof snap.value === 'string' ? snap.value : '';
      if (snap.status === 'done' || value === 'done') {
        const workflow = snap.context.workflow as Workflow;
        const outputPath = snap.context.outputPath ?? undefined;
        const writePromise = outputPath ? writer(workflow, outputPath) : writer(workflow);
        void writePromise.then(
          () => finish(0),
          (err: unknown) => {
            console.error(err instanceof Error ? err.message : String(err));
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
