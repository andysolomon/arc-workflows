import React from 'react';
import { Box, Text, useInput } from 'ink';
import { useWizard } from '../context.js';

export function WelcomePage(): React.JSX.Element {
  const [, send] = useWizard();

  useInput((_, key) => {
    if (key.return) {
      send({ type: 'SELECT_CREATE' });
    }
  });

  return (
    <Box flexDirection="column">
      <Text bold color="cyan">
        arc-workflows
      </Text>
      <Box marginTop={1}>
        <Text>Build GitHub Actions workflows with confidence.</Text>
      </Box>
      <Box marginTop={2}>
        <Text>
          Press <Text bold>Enter</Text> to create a new workflow.
        </Text>
      </Box>
    </Box>
  );
}
