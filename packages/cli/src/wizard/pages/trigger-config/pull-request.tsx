import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import type { PullRequestConfig, PullRequestActivity } from '@arc-workflows/core';
import { StringList } from '../../../components/string-list.js';

const FILTER_FIELDS = [
  'branches',
  'branches-ignore',
  'tags',
  'tags-ignore',
  'paths',
  'paths-ignore',
] as const;

type FilterField = (typeof FILTER_FIELDS)[number];

const PR_ACTIVITIES: readonly PullRequestActivity[] = [
  'opened',
  'synchronize',
  'reopened',
  'closed',
  'edited',
  'labeled',
  'unlabeled',
  'assigned',
  'unassigned',
  'ready_for_review',
  'review_requested',
  'review_request_removed',
  'milestoned',
  'demilestoned',
  'locked',
];

interface Props {
  initial: PullRequestConfig;
  onCommit: (config: PullRequestConfig) => void;
  onBack: () => void;
}

/**
 * Configures the `pull_request` trigger. Like PushConfigPage plus an
 * activity-types multi-select section. Focus order:
 *   0..5 = filter StringLists
 *   6    = activity types checklist
 *   7    = Done
 */
export function PullRequestConfigPage({ initial, onCommit, onBack }: Props): React.JSX.Element {
  const [config, setConfig] = useState<PullRequestConfig>(initial);
  const [focusIndex, setFocusIndex] = useState(0);
  const [activityCursor, setActivityCursor] = useState(0);

  const activityFocused = focusIndex === FILTER_FIELDS.length;
  const doneFocused = focusIndex === FILTER_FIELDS.length + 1;

  useInput((input, key) => {
    if (key.tab) {
      setFocusIndex((i) => (i + 1) % (FILTER_FIELDS.length + 2));
      return;
    }
    if (key.escape) {
      onBack();
      return;
    }
    if (activityFocused) {
      if (key.upArrow) {
        setActivityCursor((c) => Math.max(0, c - 1));
      } else if (key.downArrow) {
        setActivityCursor((c) => Math.min(PR_ACTIVITIES.length - 1, c + 1));
      } else if (input === ' ') {
        const activity = PR_ACTIVITIES[activityCursor];
        if (!activity) return;
        const current = config.types ?? [];
        const set = new Set(current);
        if (set.has(activity)) set.delete(activity);
        else set.add(activity);
        const nextTypes = Array.from(set);
        const next: PullRequestConfig = { ...config };
        if (nextTypes.length === 0) delete next.types;
        else next.types = nextTypes;
        setConfig(next);
      }
      return;
    }
    if (doneFocused && key.return) {
      onCommit(config);
    }
  });

  function updateFilter(field: FilterField, items: string[]): void {
    const next: PullRequestConfig = { ...config };
    if (items.length === 0) {
      delete next[field];
    } else {
      next[field] = items;
    }
    setConfig(next);
  }

  const types = config.types ?? [];

  return (
    <Box flexDirection="column">
      <Text bold>Configure pull_request trigger</Text>
      <Text dimColor>Tab to next field, Esc to go back</Text>
      {FILTER_FIELDS.map((field, i) => (
        <Box key={field} marginTop={1}>
          <StringList
            label={field}
            items={config[field] ?? []}
            onChange={(items) => updateFilter(field, items)}
            active={focusIndex === i}
          />
        </Box>
      ))}
      <Box marginTop={1} flexDirection="column">
        <Text bold>types (activity)</Text>
        {PR_ACTIVITIES.map((activity, i) => {
          const isCursor = activityFocused && i === activityCursor;
          const isChecked = types.includes(activity);
          return (
            <Box key={activity}>
              {isCursor ? <Text color="cyan">{'> '}</Text> : <Text>{'  '}</Text>}
              <Text>{`[${isChecked ? 'x' : ' '}] ${activity}`}</Text>
            </Box>
          );
        })}
      </Box>
      <Box marginTop={1}>
        {doneFocused ? <Text color="cyan">{'> [Done]'}</Text> : <Text>{'  [Done]'}</Text>}
      </Box>
    </Box>
  );
}
