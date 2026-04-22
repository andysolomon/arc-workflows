import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { COMMON_ACTIONS, type ActionStep, type CommonAction } from '@arc-workflows/core';
import { TextField } from '../../components/text-field.js';
import { KeyValueList } from '../../components/key-value-list.js';
import { NumberField } from '../../components/number-field.js';
import { SuggestionBox } from '../../components/suggestion-box.js';
import { matchExpressionContexts } from '../../lib/expression-autocomplete.js';

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
 *
 * Two autocompletes are wired here:
 *
 *   - Typing in `uses` shows a dropdown of matching common actions
 *     from `COMMON_ACTIONS` (substring on name + tags). Selecting a
 *     row replaces `uses` with `name@version`.
 *   - Typing an unclosed `${{` in a `with` or `env` value shows the
 *     12 expression contexts. Because the parent doesn't own the
 *     KeyValueList's row text, the suggestion is informational: the
 *     user sees valid contexts and types them out manually.
 */
export function ActionStepForm({ initial, onCommit, onBack }: Props): React.JSX.Element {
  const [fields, setFields] = useState<Fields>(() => initialFields(initial));
  const [focusIndex, setFocusIndex] = useState(0);
  const [error, setError] = useState('');

  const current: Position = POSITIONS[focusIndex] ?? 'done';

  // Action-picker state (uses field).
  const [matchedActions, setMatchedActions] = useState<CommonAction[]>([]);
  const [actionSuggestionsDismissed, setActionSuggestionsDismissed] = useState(false);

  // Expression-autocomplete state (with + env fields).
  const [exprMatches, setExprMatches] = useState<readonly string[]>([]);
  const [exprField, setExprField] = useState<'with' | 'env' | null>(null);
  const [exprDismissed, setExprDismissed] = useState(false);

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

  function handleUsesChange(next: string): void {
    setFields((f) => ({ ...f, uses: next }));
    setActionSuggestionsDismissed(false);

    const q = next.toLowerCase().trim();
    if (q === '') {
      setMatchedActions([]);
      return;
    }
    const matches = COMMON_ACTIONS.filter(
      (a) => a.name.toLowerCase().includes(q) || a.tags.some((t) => t.toLowerCase().includes(q)),
    ).slice(0, 10);
    setMatchedActions(matches);
  }

  function handleExprRow(fieldKey: 'with' | 'env', rowValue: string): void {
    setExprDismissed(false);
    const matches = matchExpressionContexts(rowValue);
    if (matches.length > 0) {
      setExprMatches(matches);
      setExprField(fieldKey);
    } else {
      setExprMatches([]);
      setExprField(null);
    }
  }

  const showActionSuggestions =
    current === 'uses' && matchedActions.length > 0 && !actionSuggestionsDismissed;

  const showWithExprSuggestions =
    current === 'with' && exprField === 'with' && exprMatches.length > 0 && !exprDismissed;

  const showEnvExprSuggestions =
    current === 'env' && exprField === 'env' && exprMatches.length > 0 && !exprDismissed;

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
      <Box marginTop={1} flexDirection="column">
        <TextField
          label="uses (required)"
          value={fields.uses}
          onChange={handleUsesChange}
          active={current === 'uses' && !showActionSuggestions}
          placeholder="actions/checkout@v4"
        />
        <SuggestionBox
          items={matchedActions}
          getLabel={(a) => `${a.name}@${a.version}`}
          getDescription={(a) => a.description}
          onSelect={(a) => {
            setFields((f) => ({ ...f, uses: `${a.name}@${a.version}` }));
            setMatchedActions([]);
            setActionSuggestionsDismissed(true);
          }}
          onDismiss={() => setActionSuggestionsDismissed(true)}
          active={showActionSuggestions}
        />
      </Box>
      <Box marginTop={1} flexDirection="column">
        <KeyValueList
          label="with"
          entries={fields.withMap}
          onChange={(e) => setFields((f) => ({ ...f, withMap: e }))}
          onCurrentValueChange={(v) => handleExprRow('with', v)}
          active={current === 'with' && !showWithExprSuggestions}
          placeholder="node-version=20"
        />
        <SuggestionBox
          items={exprField === 'with' ? exprMatches : []}
          getLabel={(s) => s}
          onSelect={() => {
            setExprDismissed(true);
            setExprField(null);
          }}
          onDismiss={() => {
            setExprDismissed(true);
            setExprField(null);
          }}
          active={showWithExprSuggestions}
        />
      </Box>
      <Box marginTop={1} flexDirection="column">
        <KeyValueList
          label="env"
          entries={fields.env}
          onChange={(e) => setFields((f) => ({ ...f, env: e }))}
          onCurrentValueChange={(v) => handleExprRow('env', v)}
          active={current === 'env' && !showEnvExprSuggestions}
          placeholder="NODE_ENV=production"
        />
        <SuggestionBox
          items={exprField === 'env' ? exprMatches : []}
          getLabel={(s) => s}
          onSelect={() => {
            setExprDismissed(true);
            setExprField(null);
          }}
          onDismiss={() => {
            setExprDismissed(true);
            setExprField(null);
          }}
          active={showEnvExprSuggestions}
        />
      </Box>

      <Box marginTop={1} flexDirection="column">
        <Text bold>continue-on-error</Text>
        <Box>
          {current === 'continueOnError' ? <Text color="cyan">{'> '}</Text> : <Text>{'  '}</Text>}
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
        {current === 'done' ? <Text color="cyan">{'> [Done]'}</Text> : <Text>{'  [Done]'}</Text>}
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
