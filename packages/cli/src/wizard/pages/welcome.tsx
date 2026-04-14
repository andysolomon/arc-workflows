import React from 'react';
import { Text, Box, useInput } from 'ink';
import { useWizard } from '../context.js';

export function WelcomePage(): React.JSX.Element {
  const [, send] = useWizard();

  useInput((_input, key) => {
    if (key.return) {
      send({ type: 'SELECT_CREATE' });
    }
  });

  return (
    <Box flexDirection="column" padding={1}>
      <Text bold>arc-workflows</Text>
      <Text dimColor>Build GitHub Actions workflows with confidence.</Text>
      <Box marginTop={1}>
        <Text>Press Enter to create a new workflow...</Text>
      </Box>
    </Box>
  );
}
