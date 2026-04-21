import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { useWizard } from '../context.js';

export function WorkflowNamePage(): React.JSX.Element {
  const [state, send] = useWizard();
  const { templateId, workflow } = state.context;
  const initialValue = templateId === null ? '' : (workflow.name ?? '');
  const [value, setValue] = useState(initialValue);
  const [error, setError] = useState('');

  useInput((input, key) => {
    if (key.return) {
      const trimmed = value.trim();
      if (trimmed === '') {
        setError('Workflow name cannot be empty');
        return;
      }
      setError('');
      send({ type: 'SET_NAME', name: trimmed });
      send({ type: 'NEXT' });
      return;
    }

    if (key.backspace || key.delete) {
      setValue((v) => v.slice(0, -1));
      return;
    }

    // Ignore navigation/control keys
    if (
      key.upArrow ||
      key.downArrow ||
      key.leftArrow ||
      key.rightArrow ||
      key.tab ||
      key.escape ||
      key.ctrl ||
      key.meta
    ) {
      return;
    }

    if (input && input.length > 0) {
      setValue((v) => v + input);
    }
  });

  const placeholder = 'e.g. CI';
  const displayValue = value.length > 0 ? value : placeholder;
  const isPlaceholder = value.length === 0;

  return (
    <Box flexDirection="column">
      <Text bold>Name your workflow</Text>
      <Box marginTop={1}>
        <Text>{'> '}</Text>
        {isPlaceholder ? <Text dimColor>{displayValue}</Text> : <Text>{displayValue}</Text>}
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
