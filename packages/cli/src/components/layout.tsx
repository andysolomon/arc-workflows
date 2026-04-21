import React from 'react';
import { Box, Text, useStdout } from 'ink';
import { useWizard } from '../wizard/context.js';
import { YamlPreview } from './yaml-preview.js';

const SPLIT_PANE_STATES = new Set<string>([
  'workflowName',
  'triggers',
  'jobs',
  'jobConfig',
  'steps',
  'stepConfig',
  'confirm',
]);
const MIN_SPLIT_WIDTH = 100;

interface Props {
  children: React.ReactNode;
}

export function Layout({ children }: Props): React.JSX.Element {
  const [state] = useWizard();
  const { stdout } = useStdout();
  const cols = stdout.columns ?? 80;

  const stateName = typeof state.value === 'string' ? state.value : '';
  const shouldSplit = SPLIT_PANE_STATES.has(stateName);
  const wideEnough = cols >= MIN_SPLIT_WIDTH;

  // Full-width (welcome, templateSelect, done)
  if (!shouldSplit) {
    return (
      <Box flexDirection="column" padding={1}>
        {children}
      </Box>
    );
  }

  // Small terminal → stacked
  if (!wideEnough) {
    return (
      <Box flexDirection="column">
        <Box padding={1}>{children}</Box>
        <Box
          padding={1}
          borderStyle="single"
          borderTop
          borderBottom={false}
          borderLeft={false}
          borderRight={false}
        >
          <YamlPreview />
        </Box>
      </Box>
    );
  }

  // Split-pane: 55% wizard, 1-col divider, ~44% preview
  const leftWidth = Math.floor(cols * 0.55);
  const rightWidth = cols - leftWidth - 1;

  return (
    <Box flexDirection="row">
      <Box width={leftWidth} padding={1} flexDirection="column">
        {children}
      </Box>
      <Box width={1} height="100%">
        <Text color="gray">│</Text>
      </Box>
      <Box width={rightWidth} padding={1} flexDirection="column">
        <YamlPreview />
      </Box>
    </Box>
  );
}
