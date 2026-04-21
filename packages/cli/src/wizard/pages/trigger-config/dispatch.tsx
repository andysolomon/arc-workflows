import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import type { WorkflowDispatchConfig, WorkflowDispatchStringInput } from '@arc-workflows/core';
import { StringList } from '../../../components/string-list.js';

interface Props {
  initial: WorkflowDispatchConfig;
  onCommit: (config: WorkflowDispatchConfig) => void;
  onBack: () => void;
}

/**
 * Simple workflow_dispatch input builder. Each row is "name: description"
 * and gets parsed into `{ [name]: { type: 'string', description } }`.
 *
 * Full typed-input builder (choice, boolean, number, environment, required
 * flag, options array, default) is deferred to a follow-up story.
 */
export function DispatchConfigPage({ initial, onCommit, onBack }: Props): React.JSX.Element {
  const [rows, setRows] = useState<string[]>(() =>
    Object.entries(initial.inputs ?? {}).map(([name, input]) => {
      const description = (input as WorkflowDispatchStringInput).description ?? '';
      return `${name}: ${description}`;
    }),
  );
  const [focusIndex, setFocusIndex] = useState(0); // 0 = list, 1 = Done

  const listFocused = focusIndex === 0;
  const doneFocused = focusIndex === 1;

  useInput((_input, key) => {
    if (key.tab) {
      setFocusIndex((i) => (i + 1) % 2);
      return;
    }
    if (key.escape) {
      onBack();
      return;
    }
    if (doneFocused && key.return) {
      const inputs: Record<string, WorkflowDispatchStringInput> = {};
      for (const row of rows) {
        const colon = row.indexOf(':');
        if (colon < 0) continue;
        const name = row.slice(0, colon).trim();
        const description = row.slice(colon + 1).trim();
        if (name === '') continue;
        inputs[name] = description === '' ? { type: 'string' } : { type: 'string', description };
      }
      const config: WorkflowDispatchConfig = {};
      if (Object.keys(inputs).length > 0) config.inputs = inputs;
      onCommit(config);
    }
  });

  return (
    <Box flexDirection="column">
      <Text bold>Configure workflow_dispatch trigger</Text>
      <Text dimColor>Tab to next field, Esc to go back</Text>
      <Box marginTop={1}>
        <StringList
          label="inputs (format: NAME: description)"
          items={rows}
          onChange={setRows}
          active={listFocused}
          placeholder="environment: Target deployment environment"
        />
      </Box>
      <Text dimColor>All inputs are typed as string for now.</Text>
      <Box marginTop={1}>
        {doneFocused ? <Text color="cyan">{'> [Done]'}</Text> : <Text>{'  [Done]'}</Text>}
      </Box>
    </Box>
  );
}
