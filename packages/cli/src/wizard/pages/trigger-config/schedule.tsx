import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import type { ScheduleConfig } from '@arc-workflows/core';
import { StringList } from '../../../components/string-list.js';

interface Props {
  initial: readonly ScheduleConfig[];
  onCommit: (schedules: ScheduleConfig[]) => void;
  onBack: () => void;
}

/**
 * Configures the `schedule` trigger. Each row is a cron expression
 * (5-field POSIX). Tab switches between the cron list and Done.
 */
export function ScheduleConfigPage({ initial, onCommit, onBack }: Props): React.JSX.Element {
  const [crons, setCrons] = useState<string[]>(() => initial.map((s) => s.cron));
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
      const schedules: ScheduleConfig[] = crons
        .filter((c) => c.trim() !== '')
        .map((cron) => ({ cron }));
      onCommit(schedules);
    }
  });

  return (
    <Box flexDirection="column">
      <Text bold>Configure schedule trigger</Text>
      <Text dimColor>Tab to next field, Esc to go back</Text>
      <Box marginTop={1}>
        <StringList
          label="cron expressions (5-field POSIX, e.g. 0 0 * * *)"
          items={crons}
          onChange={setCrons}
          active={listFocused}
          placeholder="0 0 * * *"
        />
      </Box>
      <Box marginTop={1}>
        {doneFocused ? <Text color="cyan">{'> [Done]'}</Text> : <Text>{'  [Done]'}</Text>}
      </Box>
    </Box>
  );
}
