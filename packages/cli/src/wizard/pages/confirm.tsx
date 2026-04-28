import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { useWizard } from '../context.js';
import { TextField } from '../../components/text-field.js';

type Focus = 'path' | 'confirm' | 'back';

function slugify(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'workflow'
  );
}

/**
 * Review page — lets the user verify the workflow, edit the save path,
 * and dispatch `CONFIRM { outputPath }` to finalize the wizard.
 */
export function ConfirmPage(): React.JSX.Element {
  const [state, send] = useWizard();
  const name = state.context.workflow.name ?? 'workflow';
  const slugDefault = `.github/workflows/${slugify(name)}.yml`;
  const [outputPath, setOutputPath] = useState<string>(
    state.context.outputPath ?? slugDefault,
  );
  const [focus, setFocus] = useState<Focus>('path');

  useInput((_input, key) => {
    if (key.escape) {
      send({ type: 'BACK' });
      return;
    }
    if (key.tab || key.downArrow) {
      setFocus((f) => (f === 'path' ? 'confirm' : f === 'confirm' ? 'back' : 'path'));
      return;
    }
    if (key.upArrow) {
      setFocus((f) => (f === 'back' ? 'confirm' : f === 'confirm' ? 'path' : 'back'));
      return;
    }
    if (key.return && focus === 'confirm') {
      send({ type: 'CONFIRM', outputPath });
      return;
    }
    if (key.return && focus === 'back') {
      send({ type: 'BACK' });
      return;
    }
  });

  const jobIds = Object.keys(state.context.workflow.jobs ?? {});

  return (
    <Box flexDirection="column">
      <Text bold>Review and save</Text>
      <Box marginTop={1}>
        <Text>
          Workflow <Text color="cyan">{name}</Text> is ready. Review the YAML preview in the right
          pane.
        </Text>
      </Box>
      <Box marginTop={1}>
        <Text dimColor>
          {jobIds.length} job{jobIds.length === 1 ? '' : 's'}
          {jobIds.length > 0 ? `: ${jobIds.join(', ')}` : ''}
        </Text>
      </Box>
      <Box marginTop={1}>
        {focus === 'path' ? (
          <TextField
            label="Save to"
            value={outputPath}
            onChange={setOutputPath}
            onSubmit={() => setFocus('confirm')}
            active
          />
        ) : (
          <Box flexDirection="column">
            <Text bold>Save to</Text>
            <Text>{`  ${outputPath}`}</Text>
          </Box>
        )}
      </Box>
      <Box marginTop={1}>
        {focus === 'confirm' ? (
          <Text color="cyan">{'> [Save and exit]'}</Text>
        ) : (
          <Text>{'  [Save and exit]'}</Text>
        )}
      </Box>
      <Box>
        {focus === 'back' ? (
          <Text color="cyan">{'> [Back to jobs]'}</Text>
        ) : (
          <Text>{'  [Back to jobs]'}</Text>
        )}
      </Box>
      <Box marginTop={1}>
        <Text dimColor>Tab/arrows to navigate, Enter to select, Esc to go back</Text>
      </Box>
    </Box>
  );
}
