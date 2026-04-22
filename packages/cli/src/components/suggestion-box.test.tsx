import React from 'react';
import { describe, expect, it } from 'vitest';
import { render } from 'ink-testing-library';
import { SuggestionBox } from './suggestion-box.js';

describe('SuggestionBox', () => {
  it('renders items when active', () => {
    const { lastFrame } = render(
      <SuggestionBox
        items={['alpha', 'beta', 'gamma']}
        getLabel={(s) => s}
        onSelect={() => undefined}
        onDismiss={() => undefined}
        active={true}
      />,
    );
    const frame = lastFrame() ?? '';
    expect(frame).toContain('alpha');
    expect(frame).toContain('beta');
    expect(frame).toContain('gamma');
  });

  it('renders the dismiss/navigate hint when active', () => {
    const { lastFrame } = render(
      <SuggestionBox
        items={['alpha']}
        getLabel={(s) => s}
        onSelect={() => undefined}
        onDismiss={() => undefined}
        active={true}
      />,
    );
    expect(lastFrame() ?? '').toContain('Esc dismiss');
  });

  it('renders nothing when inactive', () => {
    const { lastFrame } = render(
      <SuggestionBox
        items={['alpha']}
        getLabel={(s) => s}
        onSelect={() => undefined}
        onDismiss={() => undefined}
        active={false}
      />,
    );
    expect(lastFrame() ?? '').toBe('');
  });

  it('renders nothing when items list is empty', () => {
    const { lastFrame } = render(
      <SuggestionBox
        items={[]}
        getLabel={(s) => s}
        onSelect={() => undefined}
        onDismiss={() => undefined}
        active={true}
      />,
    );
    expect(lastFrame() ?? '').toBe('');
  });

  it('renders descriptions when provided', () => {
    const { lastFrame } = render(
      <SuggestionBox
        items={[{ name: 'alpha', desc: 'the first' }]}
        getLabel={(i) => i.name}
        getDescription={(i) => i.desc}
        onSelect={() => undefined}
        onDismiss={() => undefined}
        active={true}
      />,
    );
    const frame = lastFrame() ?? '';
    expect(frame).toContain('alpha');
    expect(frame).toContain('the first');
  });

  it('limits visible rows to maxVisible', () => {
    const many = Array.from({ length: 10 }, (_, i) => `item-${i}`);
    const { lastFrame } = render(
      <SuggestionBox
        items={many}
        getLabel={(s) => s}
        onSelect={() => undefined}
        onDismiss={() => undefined}
        active={true}
        maxVisible={3}
      />,
    );
    const frame = lastFrame() ?? '';
    // First three should be visible; item-3 onwards should not.
    expect(frame).toContain('item-0');
    expect(frame).toContain('item-1');
    expect(frame).toContain('item-2');
    expect(frame).not.toContain('item-3');
  });

  it('highlights the first item by default', () => {
    const { lastFrame } = render(
      <SuggestionBox
        items={['alpha', 'beta']}
        getLabel={(s) => s}
        onSelect={() => undefined}
        onDismiss={() => undefined}
        active={true}
      />,
    );
    // The focused item gets a "> " prefix.
    const frame = lastFrame() ?? '';
    expect(frame).toMatch(/>\s+alpha/);
  });
});
