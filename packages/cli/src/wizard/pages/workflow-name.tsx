import React, { useState } from 'react';
import { Box, Text } from 'ink';
import { TextInput } from '@inkjs/ui';
import { useWizard } from '../context.js';

export function WorkflowNamePage(): React.JSX.Element {
  const [state, send] = useWizard();
  const { templateId, workflow } = state.context;
  const initialValue = templateId === null ? '' : (workflow.name ?? '');
  const [error, setError] = useState('');

  function handleSubmit(value: string): void {
    const trimmed = value.trim();
    if (trimmed === '') {
      setError('Workflow name cannot be empty');
      return;
    }
    send({ type: 'SET_NAME', name: trimmed });
    send({ type: 'NEXT' });
  }

  return (
    <Box flexDirection="column">
      <Text bold>Name your workflow</Text>
      <Box marginTop={1}>
        <TextInput defaultValue={initialValue} placeholder="e.g. CI" onSubmit={handleSubmit} />
      </Box>
      {error !== '' && (
        <Box marginTop={1}>
          <Text color="red">{error}</Text>
        </Box>
      )}
      <Box marginTop={1}>
        <Text dimColor>Press Enter to continue</Text>
      </Box>
    </Box>
  );
}
