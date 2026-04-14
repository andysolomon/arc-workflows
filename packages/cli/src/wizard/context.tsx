import React, { createContext, useContext, type ReactNode } from 'react';
import { useMachine } from '@xstate/react';
import { wizardMachine } from './machine.js';
import type { WizardContext as WizardCtx } from './types.js';

type MachineSnapshot = ReturnType<typeof useMachine<typeof wizardMachine>>[0];
type MachineSend = ReturnType<typeof useMachine<typeof wizardMachine>>[1];

interface WizardContextValue {
  state: MachineSnapshot;
  send: MachineSend;
  context: WizardCtx;
}

const WizardReactContext = createContext<WizardContextValue | null>(null);

export function WizardProvider({ children }: { children: ReactNode }): React.JSX.Element {
  const [state, send] = useMachine(wizardMachine);
  return (
    <WizardReactContext.Provider value={{ state, send, context: state.context }}>
      {children}
    </WizardReactContext.Provider>
  );
}

export function useWizard(): WizardContextValue {
  const ctx = useContext(WizardReactContext);
  if (!ctx) throw new Error('useWizard must be used inside <WizardProvider>');
  return ctx;
}
