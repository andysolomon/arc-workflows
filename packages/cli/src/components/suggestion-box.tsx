import React, { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';

export interface SuggestionBoxProps<T> {
  items: readonly T[];
  getLabel: (item: T) => string;
  getDescription?: (item: T) => string;
  onSelect: (item: T) => void;
  onDismiss: () => void;
  active: boolean;
  maxVisible?: number;
}

/**
 * Generic dropdown list overlay. Renders the given items with an
 * optional secondary description and lets the user navigate with
 * Up/Down, commit with Enter, or dismiss with Esc.
 *
 * The component owns only the navigation cursor; callers provide the
 * item list (typically filtered by what the user has typed elsewhere)
 * and handle selection/dismissal via props.
 *
 * Input is only captured when `active` is true; otherwise the box
 * renders nothing and forwards no keys. When paired with a text input
 * component, the parent should gate the text input off (via its own
 * `active` prop) while the suggestion box is open so that Up/Down does
 * not drive both at once.
 */
export function SuggestionBox<T>({
  items,
  getLabel,
  getDescription,
  onSelect,
  onDismiss,
  active,
  maxVisible = 5,
}: SuggestionBoxProps<T>): React.JSX.Element | null {
  const [cursor, setCursor] = useState(0);

  // Reset cursor when the items list changes (e.g. user keeps typing
  // and narrows matches). Using a length-based dep keeps this stable
  // even when callers pass a fresh array reference every render.
  useEffect(() => {
    setCursor(0);
  }, [items.length]);

  useInput(
    (_input, key) => {
      if (!active) return;
      if (key.upArrow) {
        setCursor((c) => Math.max(0, c - 1));
      } else if (key.downArrow) {
        setCursor((c) => Math.min(items.length - 1, c + 1));
      } else if (key.return) {
        const item = items[cursor];
        if (item !== undefined) onSelect(item);
      } else if (key.escape) {
        onDismiss();
      }
    },
    { isActive: active },
  );

  if (!active || items.length === 0) return null;

  const half = Math.floor(maxVisible / 2);
  const visibleStart = Math.max(0, Math.min(cursor - half, Math.max(0, items.length - maxVisible)));
  const visibleItems = items.slice(visibleStart, visibleStart + maxVisible);

  return (
    <Box flexDirection="column" borderStyle="single" paddingX={1}>
      {visibleItems.map((item, localIdx) => {
        const globalIdx = visibleStart + localIdx;
        const isFocused = globalIdx === cursor;
        const label = getLabel(item);
        const description = getDescription?.(item);
        const hasDescription = description !== undefined && description !== '';

        return (
          <Box key={globalIdx}>
            {isFocused ? <Text color="cyan">{'> '}</Text> : <Text>{'  '}</Text>}
            {isFocused ? (
              <Text color="cyan" bold>
                {label}
              </Text>
            ) : (
              <Text>{label}</Text>
            )}
            {hasDescription ? <Text dimColor> {`— ${description}`}</Text> : null}
          </Box>
        );
      })}
      <Text dimColor>Up/Down navigate, Enter select, Esc dismiss</Text>
    </Box>
  );
}
