import React, { createContext, useContext, type ReactNode } from 'react';
import { useMachine } from '@xstate/react';
import { wizardMachine } from './machine.js';

type MachineState = ReturnType<typeof useMachine<typeof wizardMachine>>;

const WizardStateContext = createContext<MachineState | null>(null);

export function WizardProvider({ children }: { children: ReactNode }): React.JSX.Element {
  const machine = useMachine(wizardMachine);
  return <WizardStateContext.Provider value={machine}>{children}</WizardStateContext.Provider>;
}

export function useWizard(): MachineState {
  const ctx = useContext(WizardStateContext);
  if (!ctx) throw new Error('useWizard must be used within <WizardProvider>');
  return ctx;
}
