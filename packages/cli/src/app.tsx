import React from 'react';
import { Box, Text } from 'ink';
import { WizardProvider, useWizard } from './wizard/context.js';
import { WelcomePage } from './wizard/pages/welcome.js';
import { TemplateSelectPage } from './wizard/pages/template-select.js';
import { WorkflowNamePage } from './wizard/pages/workflow-name.js';

function WizardRouter(): React.JSX.Element {
  const [state] = useWizard();
  const page = state.value as string;

  switch (page) {
    case 'welcome':
      return <WelcomePage />;
    case 'templateSelect':
      return <TemplateSelectPage />;
    case 'workflowName':
      return <WorkflowNamePage />;
    default:
      return (
        <Box padding={1}>
          <Text>Page: {page} (coming soon)</Text>
        </Box>
      );
  }
}

export function App(): React.JSX.Element {
  return (
    <WizardProvider>
      <WizardRouter />
    </WizardProvider>
  );
}
