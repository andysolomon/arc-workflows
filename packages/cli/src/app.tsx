import React from 'react';
import { Box, Text } from 'ink';
import { WizardProvider, useWizard } from './wizard/context.js';
import { WelcomePage } from './wizard/pages/welcome.js';

function WizardRouter(): React.JSX.Element {
  const [state] = useWizard();
  const page = state.value as string;

  switch (page) {
    case 'welcome':
      return <WelcomePage />;
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
