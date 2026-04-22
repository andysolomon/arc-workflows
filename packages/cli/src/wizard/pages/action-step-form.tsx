import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import type { ActionStep } from '@arc-workflows/core';
import { TextField } from '../../components/text-field.js';
import { KeyValueList } from '../../components/key-value-list.js';
import { NumberField } from '../../components/number-field.js';

type Position =
  | 'name'
  | 'id'
  | 'if'
  | 'uses'
  | 'with'
  | 'env'
  | 'continueOnError'
  | 'timeoutMinutes'
  | 'workingDirectory'
  | 'done';

const POSITIONS: readonly Position[] = [
  'name',
  'id',
  'if',
  'uses',
  'with',
  'env',
  'continueOnError',
  'timeoutMinutes',
  'workingDirectory',
  'done',
];

interface Fields {
  name: string;
  id: string;
  ifExpr: string;
  uses: string;
  withMap: Record<string, string>;
  env: Record<string, string>;
  continueOnError: boolean;
  timeoutMinutes: number | null;
  workingDirectory: string;
}

interface Props {
  initial: ActionStep;
  onCommit: (step: ActionStep) => void;
  onBack: () => void;
}

/**
 * Form for an `ActionStep` (a step that invokes a reusable action via
 * `uses`). Tab cycles between fields; Enter on Done commits; Esc goes
 * back. `uses` is required; submitting with an empty `uses` keeps the
 * field focused and surfaces a local error message.
 */
export function ActionStepForm({ initial, onCommit, onBack }: Props): React.JSX.Element {
  const [fields, setFields] = useState<Fields>(() => initialFields(initial));
  const [focusIndex, setFocusIndex] = useState(0);
  const [error, setError] = useState('');

  const current: Position = POSITIONS[focusIndex] ?? 'done';

  useInput((_input, key) => {
    if (key.tab) {
      setFocusIndex((i) => (i + 1) % POSITIONS.length);
      setError('');
      return;
    }
    if (key.escape) {
      onBack();
      return;
    }
    if (current === 'continueOnError') {
      if (key.leftArrow || key.rightArrow) {
        setFields((f) => ({ ...f, continueOnError: !f.continueOnError }));
      }
      return;
    }
    if (current === 'done' && key.return) {
      if (fields.uses.trim() === '') {
        setError('uses is required');
        return;
      }
      onCommit(buildActionStep(fields));
    }
  });

  return (
    <Box flexDirection="column">
      <Text bold>Configure action step</Text>
      <Text dimColor>Tab cycles fields, Esc to go back</Text>

      <Box marginTop={1}>
        <TextField
          label="name (optional)"
          value={fields.name}
          onChange={(v) => setFields((f) => ({ ...f, name: v }))}
          active={current === 'name'}
        />
      </Box>
      <Box marginTop={1}>
        <TextField
          label="id (optional)"
          value={fields.id}
          onChange={(v) => setFields((f) => ({ ...f, id: v }))}
          active={current === 'id'}
        />
      </Box>
      <Box marginTop={1}>
        <TextField
          label="if (optional)"
          value={fields.ifExpr}
          onChange={(v) => setFields((f) => ({ ...f, ifExpr: v }))}
          active={current === 'if'}
        />
      </Box>
      <Box marginTop={1}>
        <TextField
          label="uses (required)"
          value={fields.uses}
          onChange={(v) => setFields((f) => ({ ...f, uses: v }))}
          active={current === 'uses'}
          placeholder="actions/checkout@v4"
        />
      </Box>
      <Box marginTop={1}>
        <KeyValueList
          label="with"
          entries={fields.withMap}
          onChange={(e) => setFields((f) => ({ ...f, withMap: e }))}
          active={current === 'with'}
          placeholder="node-version=20"
        />
      </Box>
      <Box marginTop={1}>
        <KeyValueList
          label="env"
          entries={fields.env}
          onChange={(e) => setFields((f) => ({ ...f, env: e }))}
          active={current === 'env'}
          placeholder="NODE_ENV=production"
        />
      </Box>

      <Box marginTop={1} flexDirection="column">
        <Text bold>continue-on-error</Text>
        <Box>
          {current === 'continueOnError' ? (
            <Text color="cyan">{'> '}</Text>
          ) : (
            <Text>{'  '}</Text>
          )}
          <Text>{fields.continueOnError ? 'true' : 'false'}</Text>
        </Box>
        {current === 'continueOnError' && <Text dimColor>Left/Right to toggle</Text>}
      </Box>

      <Box marginTop={1}>
        <NumberField
          label="timeout-minutes"
          value={fields.timeoutMinutes}
          onChange={(v) => setFields((f) => ({ ...f, timeoutMinutes: v }))}
          active={current === 'timeoutMinutes'}
          min={1}
        />
      </Box>
      <Box marginTop={1}>
        <TextField
          label="working-directory"
          value={fields.workingDirectory}
          onChange={(v) => setFields((f) => ({ ...f, workingDirectory: v }))}
          active={current === 'workingDirectory'}
          placeholder="./subdir"
        />
      </Box>

      {error !== '' && (
        <Box marginTop={1}>
          <Text color="red">{error}</Text>
        </Box>
      )}

      <Box marginTop={1}>
        {current === 'done' ? (
          <Text color="cyan">{'> [Done]'}</Text>
        ) : (
          <Text>{'  [Done]'}</Text>
        )}
      </Box>
    </Box>
  );
}

function initialFields(step: ActionStep): Fields {
  const withMap: Record<string, string> = {};
  for (const [k, v] of Object.entries(step.with ?? {})) {
    withMap[k] = String(v);
  }
  const env: Record<string, string> = {};
  for (const [k, v] of Object.entries(step.env ?? {})) {
    env[k] = String(v);
  }
  return {
    name: step.name ?? '',
    id: step.id ?? '',
    ifExpr: step.if ?? '',
    uses: step.uses ?? '',
    withMap,
    env,
    continueOnError:
      typeof step['continue-on-error'] === 'boolean' ? step['continue-on-error'] : false,
    timeoutMinutes: step['timeout-minutes'] ?? null,
    workingDirectory: step['working-directory'] ?? '',
  };
}

function buildActionStep(fields: Fields): ActionStep {
  const step: ActionStep = { uses: fields.uses };
  if (fields.name !== '') step.name = fields.name;
  if (fields.id !== '') step.id = fields.id;
  if (fields.ifExpr !== '') step.if = fields.ifExpr;
  if (Object.keys(fields.withMap).length > 0) step.with = { ...fields.withMap };
  if (Object.keys(fields.env).length > 0) step.env = { ...fields.env };
  if (fields.continueOnError) step['continue-on-error'] = true;
  if (fields.timeoutMinutes !== null) step['timeout-minutes'] = fields.timeoutMinutes;
  if (fields.workingDirectory !== '') step['working-directory'] = fields.workingDirectory;
  return step;
}
