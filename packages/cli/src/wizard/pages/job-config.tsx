import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import type { Job, NormalJob, Permissions, PermissionScope, PermissionValue } from '@arc-workflows/core';
import { useWizard } from '../context.js';
import { TextField } from '../../components/text-field.js';
import { StringList } from '../../components/string-list.js';
import { KeyValueList } from '../../components/key-value-list.js';
import { NumberField } from '../../components/number-field.js';

type PermMode = 'default' | 'read-all' | 'write-all' | 'none' | 'custom';

const PERM_OPTIONS: readonly { mode: PermMode; label: string }[] = [
  { mode: 'default', label: '(unset / workflow default)' },
  { mode: 'read-all', label: 'read-all' },
  { mode: 'write-all', label: 'write-all' },
  { mode: 'none', label: '{} (none — disable all scopes)' },
  { mode: 'custom', label: 'custom (per-scope map)' },
];

interface FieldState {
  name: string;
  runsOn: string;
  needs: string[];
  ifExpr: string;
  permMode: PermMode;
  customPerms: Record<string, string>;
  env: Record<string, string>;
  timeoutMinutes: number | null;
}

/**
 * Per-job configuration page with Tier 1 + Tier 2 fields. Reads the
 * currently-selected job id from context and pre-populates all fields
 * from its existing value. On Done, replaces the job in context via
 * `ADD_JOB` (assign overwrites existing entries) and transitions to
 * the `steps` state.
 *
 * Focus is managed with a single `focusIndex` integer; Tab cycles
 * through field positions and the Done button. Esc sends BACK.
 */
export function JobConfigPage(): React.JSX.Element {
  const [state, send] = useWizard();
  const jobId = state.context.currentJobId ?? '';
  const jobs = state.context.workflow.jobs ?? {};
  const jobCount = Object.keys(jobs).length;
  const existing: Job | undefined = jobs[jobId];
  const existingNormal = existing && 'steps' in existing ? (existing as NormalJob) : undefined;

  const showNeeds = jobCount > 1;

  const [fields, setFields] = useState<FieldState>(() => initialFieldState(existingNormal));

  // Field index layout (dynamic since `needs` is only visible when >1 job):
  //   0 = name
  //   1 = runs-on
  //   2 = needs (optional; shifts remaining indices)
  //   3 = if
  //   4 = permissions mode picker
  //   5 = custom permissions KV list (only when permMode === 'custom')
  //   6 = env
  //   7 = timeout-minutes
  //   8 = [Done]
  const positions = buildPositions(showNeeds, fields.permMode === 'custom');

  const [focusIndex, setFocusIndex] = useState(0);

  function current(): (typeof positions)[number] {
    // Safe because focusIndex is clamped in Tab handler.
    return positions[focusIndex] ?? 'done';
  }

  useInput((input, key) => {
    if (key.tab) {
      setFocusIndex((i) => (i + 1) % positions.length);
      return;
    }
    if (key.escape) {
      send({ type: 'BACK' });
      return;
    }
    if (current() === 'permMode') {
      if (key.leftArrow) {
        setFields((f) => ({ ...f, permMode: prevPermMode(f.permMode) }));
      } else if (key.rightArrow) {
        setFields((f) => ({ ...f, permMode: nextPermMode(f.permMode) }));
      }
      return;
    }
    if (current() === 'done' && key.return) {
      const newJob = buildNormalJob(existingNormal, fields);
      send({ type: 'ADD_JOB', id: jobId, job: newJob });
      send({ type: 'NEXT' });
      return;
    }
    // Ignore other input when on read-only rows
    void input;
  });

  return (
    <Box flexDirection="column">
      <Text bold>Configure job: {jobId === '' ? '(no job selected)' : jobId}</Text>
      <Text dimColor>Tab cycles fields, Esc goes back</Text>

      <Box marginTop={1}>
        <TextField
          label="name (optional)"
          value={fields.name}
          onChange={(v) => setFields((f) => ({ ...f, name: v }))}
          active={current() === 'name'}
          placeholder="My job"
        />
      </Box>

      <Box marginTop={1} flexDirection="column">
        <TextField
          label="runs-on (required)"
          value={fields.runsOn}
          onChange={(v) => setFields((f) => ({ ...f, runsOn: v }))}
          active={current() === 'runsOn'}
          placeholder="ubuntu-latest"
        />
        <Text dimColor>
          Common: ubuntu-latest, ubuntu-24.04, windows-latest, macos-latest, self-hosted
        </Text>
      </Box>

      {showNeeds && (
        <Box marginTop={1}>
          <StringList
            label="needs (other job ids)"
            items={fields.needs}
            onChange={(items) => setFields((f) => ({ ...f, needs: items }))}
            active={current() === 'needs'}
            placeholder="other-job-id"
          />
        </Box>
      )}

      <Box marginTop={1}>
        <TextField
          label="if (optional)"
          value={fields.ifExpr}
          onChange={(v) => setFields((f) => ({ ...f, ifExpr: v }))}
          active={current() === 'if'}
          placeholder="${{ github.ref == 'refs/heads/main' }}"
        />
      </Box>

      <Box marginTop={1} flexDirection="column">
        <Text bold>permissions</Text>
        {PERM_OPTIONS.map((opt) => {
          const selected = fields.permMode === opt.mode;
          const focused = current() === 'permMode';
          return (
            <Box key={opt.mode}>
              {selected ? <Text>{'('}</Text> : <Text>{' '}</Text>}
              {selected ? (
                focused ? (
                  <Text color="cyan">*</Text>
                ) : (
                  <Text>*</Text>
                )
              ) : (
                <Text> </Text>
              )}
              {selected ? <Text>{') '}</Text> : <Text>{'  '}</Text>}
              {selected && focused ? (
                <Text color="cyan" bold>
                  {opt.label}
                </Text>
              ) : (
                <Text>{opt.label}</Text>
              )}
            </Box>
          );
        })}
        {current() === 'permMode' && <Text dimColor>Left/Right to change</Text>}
      </Box>

      {fields.permMode === 'custom' && (
        <Box marginTop={1}>
          <KeyValueList
            label="custom permissions (scope=read|write|none)"
            entries={fields.customPerms}
            onChange={(e) => setFields((f) => ({ ...f, customPerms: e }))}
            active={current() === 'customPerms'}
            placeholder="contents=read"
          />
        </Box>
      )}

      <Box marginTop={1}>
        <KeyValueList
          label="env"
          entries={fields.env}
          onChange={(e) => setFields((f) => ({ ...f, env: e }))}
          active={current() === 'env'}
          placeholder="NODE_ENV=production"
        />
      </Box>

      <Box marginTop={1}>
        <NumberField
          label="timeout-minutes"
          value={fields.timeoutMinutes}
          onChange={(v) => setFields((f) => ({ ...f, timeoutMinutes: v }))}
          active={current() === 'timeoutMinutes'}
          min={1}
        />
      </Box>

      <Box marginTop={1}>
        {current() === 'done' ? (
          <Text color="cyan">{'> [Done]'}</Text>
        ) : (
          <Text>{'  [Done]'}</Text>
        )}
      </Box>
    </Box>
  );
}

type Position =
  | 'name'
  | 'runsOn'
  | 'needs'
  | 'if'
  | 'permMode'
  | 'customPerms'
  | 'env'
  | 'timeoutMinutes'
  | 'done';

function buildPositions(showNeeds: boolean, showCustomPerms: boolean): Position[] {
  const out: Position[] = ['name', 'runsOn'];
  if (showNeeds) out.push('needs');
  out.push('if', 'permMode');
  if (showCustomPerms) out.push('customPerms');
  out.push('env', 'timeoutMinutes', 'done');
  return out;
}

function nextPermMode(mode: PermMode): PermMode {
  const idx = PERM_OPTIONS.findIndex((o) => o.mode === mode);
  const next = PERM_OPTIONS[(idx + 1) % PERM_OPTIONS.length];
  return next?.mode ?? 'default';
}

function prevPermMode(mode: PermMode): PermMode {
  const idx = PERM_OPTIONS.findIndex((o) => o.mode === mode);
  const len = PERM_OPTIONS.length;
  const next = PERM_OPTIONS[(idx - 1 + len) % len];
  return next?.mode ?? 'default';
}

function initialFieldState(job: NormalJob | undefined): FieldState {
  const needs =
    job?.needs === undefined
      ? []
      : Array.isArray(job.needs)
        ? [...job.needs]
        : [job.needs];

  const { permMode, customPerms } = initialPermState(job?.permissions);

  const envSource = job?.env ?? {};
  const env: Record<string, string> = {};
  for (const [k, v] of Object.entries(envSource)) {
    env[k] = String(v);
  }

  const runsOnRaw = job?.['runs-on'];
  const runsOn =
    typeof runsOnRaw === 'string'
      ? runsOnRaw
      : Array.isArray(runsOnRaw)
        ? runsOnRaw.join(',')
        : 'ubuntu-latest';

  return {
    name: job?.name ?? '',
    runsOn,
    needs,
    ifExpr: job?.if ?? '',
    permMode,
    customPerms,
    env,
    timeoutMinutes: job?.['timeout-minutes'] ?? null,
  };
}

function initialPermState(perms: Permissions | undefined): {
  permMode: PermMode;
  customPerms: Record<string, string>;
} {
  if (perms === undefined) return { permMode: 'default', customPerms: {} };
  if (perms === 'read-all') return { permMode: 'read-all', customPerms: {} };
  if (perms === 'write-all') return { permMode: 'write-all', customPerms: {} };
  if (typeof perms === 'object' && Object.keys(perms).length === 0) {
    return { permMode: 'none', customPerms: {} };
  }
  const map: Record<string, string> = {};
  for (const [k, v] of Object.entries(perms)) {
    if (typeof v === 'string') map[k] = v;
  }
  return { permMode: 'custom', customPerms: map };
}

function buildNormalJob(existing: NormalJob | undefined, fields: FieldState): NormalJob {
  const baseSteps = existing?.steps ?? [];

  const job: NormalJob = {
    'runs-on': fields.runsOn === '' ? 'ubuntu-latest' : fields.runsOn,
    steps: baseSteps,
  };

  if (fields.name !== '') job.name = fields.name;
  if (fields.needs.length === 1 && fields.needs[0] !== undefined) {
    job.needs = fields.needs[0];
  } else if (fields.needs.length > 1) {
    job.needs = [...fields.needs];
  }
  if (fields.ifExpr !== '') job.if = fields.ifExpr;

  const perms = buildPermissions(fields.permMode, fields.customPerms);
  if (perms !== undefined) {
    job.permissions = perms;
  }

  if (Object.keys(fields.env).length > 0) job.env = { ...fields.env };
  if (fields.timeoutMinutes !== null) job['timeout-minutes'] = fields.timeoutMinutes;

  // Preserve other passthrough fields we don't edit yet (strategy, container, etc.)
  if (existing) {
    if (existing.environment !== undefined) job.environment = existing.environment;
    if (existing.concurrency !== undefined) job.concurrency = existing.concurrency;
    if (existing.outputs !== undefined) job.outputs = existing.outputs;
    if (existing.defaults !== undefined) job.defaults = existing.defaults;
    if (existing.strategy !== undefined) job.strategy = existing.strategy;
    if (existing.container !== undefined) job.container = existing.container;
    if (existing.services !== undefined) job.services = existing.services;
    if (existing['continue-on-error'] !== undefined) {
      job['continue-on-error'] = existing['continue-on-error'];
    }
  }

  return job;
}

function buildPermissions(
  mode: PermMode,
  customPerms: Record<string, string>,
): Permissions | undefined {
  if (mode === 'default') return undefined;
  if (mode === 'read-all') return 'read-all';
  if (mode === 'write-all') return 'write-all';
  if (mode === 'none') return {};
  // custom
  const valid: Partial<Record<PermissionScope, PermissionValue>> = {};
  for (const [k, v] of Object.entries(customPerms)) {
    if (v === 'read' || v === 'write' || v === 'none') {
      valid[k as PermissionScope] = v;
    }
  }
  return valid;
}
