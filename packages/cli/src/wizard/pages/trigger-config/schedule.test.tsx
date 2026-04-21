import React from 'react';
import { describe, expect, it } from 'vitest';
import { render } from 'ink-testing-library';
import { ScheduleConfigPage } from './schedule.js';

describe('ScheduleConfigPage', () => {
  it('renders the cron list field', () => {
    const { lastFrame } = render(
      <ScheduleConfigPage initial={[]} onCommit={() => undefined} onBack={() => undefined} />,
    );
    const frame = lastFrame() ?? '';
    expect(frame).toContain('Configure schedule trigger');
    expect(frame).toContain('cron expressions');
  });

  it('renders initial cron values', () => {
    const { lastFrame } = render(
      <ScheduleConfigPage
        initial={[{ cron: '0 0 * * *' }, { cron: '30 3 * * 1' }]}
        onCommit={() => undefined}
        onBack={() => undefined}
      />,
    );
    const frame = lastFrame() ?? '';
    expect(frame).toContain('0 0 * * *');
    expect(frame).toContain('30 3 * * 1');
  });
});
