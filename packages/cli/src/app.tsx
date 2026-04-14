import React from 'react';
import { Text } from 'ink';
import { WizardProvider, useWizard } from './wizard/context.js';
import { WelcomePage } from './wizard/pages/welcome.js';
import { StubPage } from './wizard/pages/stub.js';

function WizardRouter(): React.JSX.Element {
  const { state } = useWizard();
  const page = state.value as string;

  switch (page) {
    case 'welcome':
      return <WelcomePage />;
    case 'templateSelect':
      return <StubPage title="Select a template" />;
    case 'workflowName':
      return <StubPage title="Name your workflow" />;
    case 'triggers':
      return <StubPage title="Configure triggers" />;
    case 'jobs':
      return <StubPage title="Configure jobs" />;
    case 'jobConfig':
      return <StubPage title="Job configuration" />;
    case 'steps':
      return <StubPage title="Configure steps" />;
    case 'stepConfig':
      return <StubPage title="Step configuration" />;
    case 'confirm':
      return <StubPage title="Confirm and generate" />;
    case 'done':
      return <Text color="green">Workflow generated!</Text>;
    default:
      return <Text color="red">Unknown state: {page}</Text>;
  }
}

export function App(): React.JSX.Element {
  return (
    <WizardProvider>
      <WizardRouter />
    </WizardProvider>
  );
}
