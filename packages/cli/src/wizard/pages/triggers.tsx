import React, { useCallback, useEffect, useState } from 'react';
import type { Triggers } from '@arc-workflows/core';
import { useWizard } from '../context.js';
import { TriggerSelectPage, type TriggerEventKey } from './trigger-config/trigger-select.js';
import { PushConfigPage } from './trigger-config/push.js';
import { PullRequestConfigPage } from './trigger-config/pull-request.js';
import { ScheduleConfigPage } from './trigger-config/schedule.js';
import { DispatchConfigPage } from './trigger-config/dispatch.js';
import { CallConfigPage } from './trigger-config/call.js';

type SubPage = 'select' | TriggerEventKey;

const EVENT_ORDER: readonly TriggerEventKey[] = [
  'push',
  'pull_request',
  'schedule',
  'workflow_dispatch',
  'workflow_call',
];

/**
 * Top-level wizard page for the `triggers` state. Local React state
 * manages routing between the select checklist and per-event config
 * sub-pages. `CONFIGURE_TRIGGERS` fires on every meaningful change so
 * the split-pane YAML preview updates live. On Done (after the last
 * selected event's config page), dispatches `NEXT` to move the wizard
 * to the `jobs` state.
 */
export function TriggersPage(): React.JSX.Element {
  const [state, send] = useWizard();
  const existing: Triggers = state.context.workflow.on ?? {};

  const [selected, setSelected] = useState<Set<TriggerEventKey>>(
    () =>
      new Set(
        Object.keys(existing).filter((k) =>
          EVENT_ORDER.includes(k as TriggerEventKey),
        ) as TriggerEventKey[],
      ),
  );
  const [config, setConfig] = useState<Triggers>(existing);
  const [subPage, setSubPage] = useState<SubPage>('select');

  // Live preview: dispatch CONFIGURE_TRIGGERS whenever the accumulating
  // config changes so the YAML pane updates immediately.
  useEffect(() => {
    send({ type: 'CONFIGURE_TRIGGERS', triggers: config });
  }, [config, send]);

  const activeEvents = EVENT_ORDER.filter((k) => selected.has(k));

  const nextAfter = useCallback(
    (current: TriggerEventKey): SubPage | 'done' => {
      const idx = activeEvents.indexOf(current);
      if (idx < 0 || idx === activeEvents.length - 1) return 'done';
      const next = activeEvents[idx + 1];
      return next ?? 'done';
    },
    [activeEvents],
  );

  const prevOf = useCallback(
    (current: TriggerEventKey): SubPage => {
      const idx = activeEvents.indexOf(current);
      if (idx <= 0) return 'select';
      const prev = activeEvents[idx - 1];
      return prev ?? 'select';
    },
    [activeEvents],
  );

  function handleSelectCommit(nextSelected: Set<TriggerEventKey>): void {
    setSelected(nextSelected);

    // Initialize config entries for newly-selected events, remove deselected
    const nextConfig: Triggers = { ...config };
    for (const key of nextSelected) {
      if (!(key in nextConfig)) {
        if (key === 'schedule') {
          nextConfig.schedule = [];
        } else if (key === 'workflow_dispatch' || key === 'workflow_call') {
          nextConfig[key] = null;
        } else {
          nextConfig[key] = {};
        }
      }
    }
    for (const key of EVENT_ORDER) {
      if (!nextSelected.has(key) && key in nextConfig) {
        delete nextConfig[key];
      }
    }
    setConfig(nextConfig);

    const first = EVENT_ORDER.find((k) => nextSelected.has(k));
    setSubPage(first ?? 'select');
  }

  function handleDone(): void {
    send({ type: 'CONFIGURE_TRIGGERS', triggers: config });
    send({ type: 'NEXT' });
  }

  function commitEvent<K extends TriggerEventKey>(key: K, value: Triggers[K]): void {
    const nextConfig = { ...config, [key]: value } as Triggers;
    setConfig(nextConfig);
    const next = nextAfter(key);
    if (next === 'done') handleDone();
    else setSubPage(next);
  }

  if (subPage === 'select') {
    return (
      <TriggerSelectPage
        initial={selected}
        onCommit={handleSelectCommit}
        onBack={() => send({ type: 'BACK' })}
      />
    );
  }

  if (subPage === 'push') {
    return (
      <PushConfigPage
        initial={config.push ?? {}}
        onCommit={(pushConfig) => commitEvent('push', pushConfig)}
        onBack={() => setSubPage(prevOf('push'))}
      />
    );
  }

  if (subPage === 'pull_request') {
    return (
      <PullRequestConfigPage
        initial={config.pull_request ?? {}}
        onCommit={(prConfig) => commitEvent('pull_request', prConfig)}
        onBack={() => setSubPage(prevOf('pull_request'))}
      />
    );
  }

  if (subPage === 'schedule') {
    return (
      <ScheduleConfigPage
        initial={config.schedule ?? []}
        onCommit={(schedules) => {
          const next = { ...config, schedule: schedules };
          setConfig(next);
          const after = nextAfter('schedule');
          if (after === 'done') handleDone();
          else setSubPage(after);
        }}
        onBack={() => setSubPage(prevOf('schedule'))}
      />
    );
  }

  if (subPage === 'workflow_dispatch') {
    return (
      <DispatchConfigPage
        initial={config.workflow_dispatch ?? {}}
        onCommit={(dispatchConfig) => commitEvent('workflow_dispatch', dispatchConfig)}
        onBack={() => setSubPage(prevOf('workflow_dispatch'))}
      />
    );
  }

  if (subPage === 'workflow_call') {
    return (
      <CallConfigPage
        initial={config.workflow_call ?? {}}
        onCommit={(callConfig) => commitEvent('workflow_call', callConfig)}
        onBack={() => setSubPage(prevOf('workflow_call'))}
      />
    );
  }

  // Exhaustive check
  const exhaustive: never = subPage;
  void exhaustive;
  return <></>;
}
