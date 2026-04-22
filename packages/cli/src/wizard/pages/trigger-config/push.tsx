import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import type { PushConfig } from '@arc-workflows/core';
import { StringList } from '../../../components/string-list.js';

const FIELDS = [
  'branches',
  'branches-ignore',
  'tags',
  'tags-ignore',
  'paths',
  'paths-ignore',
] as const;

type Field = (typeof FIELDS)[number];

interface Props {
  initial: PushConfig;
  onCommit: (config: PushConfig) => void;
  onBack: () => void;
}

/**
 * Configures the `push` trigger. Each of the 6 filter fields is an
 * editable StringList. Tab cycles focus through the fields and the
 * Done button. Enter on Done commits. Esc goes back.
 */
export function PushConfigPage({ initial, onCommit, onBack }: Props): React.JSX.Element {
  const [config, setConfig] = useState<PushConfig>(initial);
  const [focusIndex, setFocusIndex] = useState(0); // 0..5 = StringList, 6 = Done

  useInput((_input, key) => {
    if (key.tab) {
      setFocusIndex((i) => (i + 1) % (FIELDS.length + 1));
      return;
    }
    if (key.escape) {
      onBack();
      return;
    }
    if (focusIndex === FIELDS.length && key.return) {
      onCommit(config);
    }
  });

  function updateField(field: Field, items: string[]): void {
    const next: PushConfig = { ...config };
    if (items.length === 0) {
      delete next[field];
    } else {
      next[field] = items;
    }
    setConfig(next);
  }

  return (
    <Box flexDirection="column">
      <Text bold>Configure push trigger</Text>
      <Text dimColor>Tab to next field, Esc to go back</Text>
      {FIELDS.map((field, i) => (
        <Box key={field} marginTop={1}>
          <StringList
            label={field}
            items={config[field] ?? []}
            onChange={(items) => updateField(field, items)}
            active={focusIndex === i}
          />
        </Box>
      ))}
      <Box marginTop={1}>
        {focusIndex === FIELDS.length ? (
          <Text color="cyan">{'> [Done]'}</Text>
        ) : (
          <Text>{'  [Done]'}</Text>
        )}
      </Box>
    </Box>
  );
}
