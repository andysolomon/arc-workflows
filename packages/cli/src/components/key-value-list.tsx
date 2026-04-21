import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';

export interface KeyValueListProps {
  label: string;
  entries: Record<string, string>;
  onChange: (entries: Record<string, string>) => void;
  placeholder?: string;
  active?: boolean;
}

/**
 * Editable list of KEY=VALUE entries. Each row is a single string that
 * is parsed on change. Up/Down navigates, Enter adds a new row,
 * Backspace deletes the last character (or removes an empty row).
 */
export function KeyValueList({
  label,
  entries,
  onChange,
  placeholder,
  active = true,
}: KeyValueListProps): React.JSX.Element {
  const [rows, setRows] = useState<string[]>(() => {
    const items = Object.entries(entries).map(([k, v]) => `${k}=${v}`);
    return items.length === 0 ? [''] : items;
  });
  const [cursor, setCursor] = useState(0);

  function commit(newRows: string[]): void {
    setRows(newRows);
    const next: Record<string, string> = {};
    for (const row of newRows) {
      const eq = row.indexOf('=');
      if (eq > 0) {
        const key = row.slice(0, eq).trim();
        const val = row.slice(eq + 1).trim();
        if (key !== '') next[key] = val;
      }
    }
    onChange(next);
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
        commit(next);
        setCursor(cursor + 1);
        return;
      }
      if (key.backspace || key.delete) {
        const current = rows[cursor] ?? '';
        if (current === '' && rows.length > 1) {
          const next = rows.filter((_, i) => i !== cursor);
          commit(next);
          setCursor(Math.max(0, cursor - 1));
        } else {
          const next = [...rows];
          next[cursor] = current.slice(0, -1);
          commit(next);
        }
        return;
      }
      if (
        key.leftArrow ||
        key.rightArrow ||
        key.tab ||
        key.escape ||
        key.meta ||
        key.ctrl
      ) {
        return;
      }
      if (input && input.length > 0) {
        const next = [...rows];
        next[cursor] = (next[cursor] ?? '') + input;
        commit(next);
      }
    },
    { isActive: active },
  );

  return (
    <Box flexDirection="column">
      <Box>
        <Text bold>{label} </Text>
        <Text dimColor>(KEY=VALUE per line)</Text>
      </Box>
      {rows.map((row, i) => {
        const isCursor = active && i === cursor;
        return (
          <Box key={i}>
            {isCursor ? (
              <Text color="cyan">{'> '}</Text>
            ) : (
              <Text>{'  '}</Text>
            )}
            {row === '' ? (
              <Text dimColor>{placeholder ?? 'KEY=VALUE'}</Text>
            ) : (
              <Text>{row}</Text>
            )}
          </Box>
        );
      })}
    </Box>
  );
}
