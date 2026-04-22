import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'ink-testing-library';
import { KeyValueList } from './key-value-list.js';

describe('KeyValueList', () => {
  it('renders the label and initial entries', () => {
    const { lastFrame } = render(
      <KeyValueList label="env" entries={{ NODE_ENV: 'production' }} onChange={() => undefined} />,
    );
    const frame = lastFrame() ?? '';
    expect(frame).toContain('env');
    expect(frame).toContain('NODE_ENV=production');
  });

  it('renders placeholder hint when empty', () => {
    const { lastFrame } = render(
      <KeyValueList label="env" entries={{}} onChange={() => undefined} />,
    );
    expect(lastFrame() ?? '').toContain('KEY=VALUE');
  });

  it('does not capture input when inactive', () => {
    const onChange = vi.fn();
    const { stdin } = render(
      <KeyValueList label="env" entries={{}} onChange={onChange} active={false} />,
    );
    stdin.write('A');
    expect(onChange).not.toHaveBeenCalled();
  });

  it('accepts an optional onCurrentValueChange callback without crashing', () => {
    const onCurrentValueChange = vi.fn();
    const { lastFrame } = render(
      <KeyValueList
        label="env"
        entries={{ NODE_ENV: 'production' }}
        onChange={() => undefined}
        onCurrentValueChange={onCurrentValueChange}
      />,
    );
    // The component renders as before; the new prop is additive.
    expect(lastFrame() ?? '').toContain('NODE_ENV=production');
  });
});
