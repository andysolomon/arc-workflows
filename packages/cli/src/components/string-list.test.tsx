import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'ink-testing-library';
import { StringList } from './string-list.js';

describe('StringList', () => {
  it('renders the label', () => {
    const { lastFrame } = render(
      <StringList label="branches" items={['main']} onChange={() => undefined} />,
    );
    const frame = lastFrame() ?? '';
    expect(frame).toContain('branches');
    expect(frame).toContain('main');
  });

  it('renders placeholder when empty', () => {
    const { lastFrame } = render(
      <StringList label="tags" items={[]} onChange={() => undefined} placeholder="(add a tag)" />,
    );
    expect(lastFrame() ?? '').toContain('(add a tag)');
  });

  it('does not capture input when inactive', () => {
    const onChange = vi.fn();
    const { stdin } = render(
      <StringList label="branches" items={['main']} onChange={onChange} active={false} />,
    );
    stdin.write('x');
    expect(onChange).not.toHaveBeenCalled();
  });
});
