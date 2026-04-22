import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';

export interface StringListProps {
  label: string;
  items: string[];
  onChange: (items: string[]) => void;
  placeholder?: string;
  active?: boolean;
}

/**
 * Editable list of strings. Up/Down navigates rows, Enter adds a new
 * empty row below the cursor, Backspace deletes the last char (or
 * deletes an empty row), typing appends to the current row.
 */
export function StringList({
  label,
  items,
  onChange,
  placeholder,
  active = true,
}: StringListProps): React.JSX.Element {
  // Local row state so we can hold empty rows the user is editing. We
  // publish non-empty rows (and the currently-edited row) to the parent
  // via onChange.
  const [rows, setRows] = useState<string[]>(() => (items.length === 0 ? [''] : [...items]));
  const [cursor, setCursor] = useState(0);

  function publish(next: string[]): void {
    setRows(next);
    onChange(next.filter((r) => r !== ''));
  }

  useInput(
    (input, key) => {
      if (!active) return;

      if (key.upArrow) {
        setCursor((c) => Math.max(0, c - 1));
        return;
      }
      if (key.downArrow) {
        setCursor((c) => Math.min(rows.length - 1, c + 1));
        return;
      }
      if (key.return) {
        const next = [...rows];
        next.splice(cursor + 1, 0, '');
        publish(next);
        setCursor(cursor + 1);
        return;
      }
      if (key.backspace || key.delete) {
        const current = rows[cursor] ?? '';
        if (current === '' && rows.length > 1) {
          const next = rows.filter((_, i) => i !== cursor);
          publish(next);
          setCursor(Math.max(0, cursor - 1));
        } else {
          const next = [...rows];
          next[cursor] = current.slice(0, -1);
          publish(next);
        }
        return;
      }
      if (key.leftArrow || key.rightArrow || key.tab || key.escape || key.meta || key.ctrl) {
        return;
      }
      if (input && input.length > 0) {
        const next = [...rows];
        next[cursor] = (next[cursor] ?? '') + input;
        publish(next);
      }
    },
    { isActive: active },
  );

  return (
    <Box flexDirection="column">
      <Text bold>{label}</Text>
      {rows.map((row, i) => {
        const isCursor = active && i === cursor;
        return (
          <Box key={i}>
            {isCursor ? <Text color="cyan">{'> '}</Text> : <Text>{'  '}</Text>}
            {row === '' ? <Text dimColor>{placeholder ?? '(empty)'}</Text> : <Text>{row}</Text>}
          </Box>
        );
      })}
    </Box>
  );
}
