import React from 'react';
import { Text, Box, useInput } from 'ink';
import { useWizard } from '../context.js';

interface Props {
  title: string;
}

export function StubPage({ title }: Props): React.JSX.Element {
  const { send } = useWizard();

  useInput((_input, key) => {
    if (key.return) send({ type: 'NEXT' });
    if (key.escape) send({ type: 'BACK' });
  });

  return (
    <Box flexDirection="column" padding={1}>
      <Text bold>{title}</Text>
      <Text dimColor>(placeholder — press Enter for next, Escape for back)</Text>
    </Box>
  );
}
