import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';

export type TriggerEventKey =
  | 'push'
  | 'pull_request'
  | 'schedule'
  | 'workflow_dispatch'
  | 'workflow_call';

interface TriggerEventMeta {
  key: TriggerEventKey;
  label: string;
  description: string;
}

export const TRIGGER_EVENTS: readonly TriggerEventMeta[] = [
  { key: 'push', label: 'push', description: 'Run on pushed commits' },
  { key: 'pull_request', label: 'pull_request', description: 'Run on pull request events' },
  { key: 'schedule', label: 'schedule', description: 'Run on a cron schedule' },
  {
    key: 'workflow_dispatch',
    label: 'workflow_dispatch',
    description: 'Manually triggered with typed inputs',
  },
  {
    key: 'workflow_call',
    label: 'workflow_call',
    description: 'Reusable workflow callable from other workflows',
  },
];

interface Props {
  initial: Set<TriggerEventKey>;
  onCommit: (selected: Set<TriggerEventKey>) => void;
  onBack: () => void;
}

/**
 * Multi-select checklist for the top 5 trigger events. Space toggles the
 * highlighted row, Enter commits the selection, Escape goes back.
 */
export function TriggerSelectPage({ initial, onCommit, onBack }: Props): React.JSX.Element {
  const [selected, setSelected] = useState<Set<TriggerEventKey>>(() => new Set(initial));
  const [cursor, setCursor] = useState(0);
  const [error, setError] = useState('');

  useInput((input, key) => {
    if (key.upArrow) {
      setCursor((c) => Math.max(0, c - 1));
    } else if (key.downArrow) {
      setCursor((c) => Math.min(TRIGGER_EVENTS.length - 1, c + 1));
    } else if (input === ' ') {
      const evt = TRIGGER_EVENTS[cursor];
      if (!evt) return;
      const next = new Set(selected);
      if (next.has(evt.key)) next.delete(evt.key);
      else next.add(evt.key);
      setSelected(next);
      setError('');
    } else if (key.return) {
      if (selected.size === 0) {
        setError('Select at least one trigger (press Space to toggle)');
        return;
      }
      onCommit(selected);
    } else if (key.escape) {
      onBack();
    }
  });

  return (
    <Box flexDirection="column">
      <Text bold>Select triggers</Text>
      <Box marginTop={1} flexDirection="column">
        {TRIGGER_EVENTS.map((evt, i) => {
          const isCursor = i === cursor;
          const isChecked = selected.has(evt.key);
          return (
            <Box key={evt.key}>
              {isCursor ? (
                <Text color="cyan">{'> '}</Text>
              ) : (
                <Text>{'  '}</Text>
              )}
              <Text>{`[${isChecked ? 'x' : ' '}] `}</Text>
              <Text bold={isCursor}>{evt.label}</Text>
              <Text dimColor> — {evt.description}</Text>
            </Box>
          );
        })}
      </Box>
      {error !== '' && (
        <Box marginTop={1}>
          <Text color="red">{error}</Text>
        </Box>
      )}
      <Box marginTop={1}>
        <Text dimColor>
          Up/Down navigate, Space toggles, Enter commits, Esc back
        </Text>
      </Box>
    </Box>
  );
}
