import React, { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useMachine, useSelector } from '@xstate/react';
import { createActor, type ActorRefFrom } from 'xstate';
import { wizardMachine } from './machine.js';

type MachineState = ReturnType<typeof useMachine<typeof wizardMachine>>;

/**
 * External xstate actor driving the wizard. Exported from this module
 * so tests and the `runCreate` command can inject a shared actor into
 * the React tree.
 */
export type WizardActor = ActorRefFrom<typeof wizardMachine>;

const WizardStateContext = createContext<MachineState | null>(null);

/**
 * Provider for the wizard state machine.
 *
 * - When no `actor` prop is passed, the provider creates its own machine
 *   via `useMachine(wizardMachine)` — the default production behavior
 *   used by `<App />`.
 * - When an external `actor` is passed, the provider subscribes to its
 *   snapshots via `useSelector`. This enables programmatic tests (and
 *   the `runCreate` command) to create a shared actor, observe its
 *   state from outside the tree, and dispatch events directly.
 */
export function WizardProvider({
  actor,
  children,
}: {
  actor?: WizardActor;
  children: ReactNode;
}): React.JSX.Element {
  if (actor) {
    return <ExternalActorProvider actor={actor}>{children}</ExternalActorProvider>;
  }
  return <InternalMachineProvider>{children}</InternalMachineProvider>;
}

function InternalMachineProvider({ children }: { children: ReactNode }): React.JSX.Element {
  const machine = useMachine(wizardMachine);
  return <WizardStateContext.Provider value={machine}>{children}</WizardStateContext.Provider>;
}

function ExternalActorProvider({
  actor,
  children,
}: {
  actor: WizardActor;
  children: ReactNode;
}): React.JSX.Element {
  const snapshot = useSelector(actor, (s) => s);
  const send = actor.send.bind(actor);
  // Match the tuple shape returned by useMachine: [state, send, service].
  const value = useMemo(
    () => [snapshot, send, actor] as unknown as MachineState,
    [snapshot, send, actor],
  );
  return <WizardStateContext.Provider value={value}>{children}</WizardStateContext.Provider>;
}

export function useWizard(): MachineState {
  const ctx = useContext(WizardStateContext);
  if (!ctx) throw new Error('useWizard must be used within <WizardProvider>');
  return ctx;
}

/**
 * Convenience helper for tests: create and start a fresh wizard actor.
 */
export function createTestActor(): WizardActor {
  const actor = createActor(wizardMachine);
  actor.start();
  return actor;
}

/**
 * Thin alias of `WizardProvider` that makes the intent ("this is a test
 * render wiring an external actor") explicit at the call site.
 */
export function TestWizardProvider({
  actor,
  children,
}: {
  actor: WizardActor;
  children: ReactNode;
}): React.JSX.Element {
  return <WizardProvider actor={actor}>{children}</WizardProvider>;
}
