import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import type { Matrix } from '@arc-workflows/core';
import { TextField } from '../../components/text-field.js';
import { StringList } from '../../components/string-list.js';

interface Dimension {
  name: string;
  values: string[];
}

interface Props {
  initial: Matrix | undefined;
  onCommit: (matrix: Matrix | undefined) => void;
  onBack: () => void;
}

/**
 * Sub-page for editing the `strategy.matrix` dimension bag. Lets the
 * user add/edit matrix dimensions (each a named list of string values).
 * `include` and `exclude` rows are preserved through the editor but are
 * not editable here (deferred to a follow-up story).
 *
 * Tab cycles focus through each dimension's name, its values list, and
 * finally the "+ Add dimension" and "Done" rows. Enter on "+ Add
 * dimension" appends an empty dimension; Enter on Done calls
 * `onCommit`. Esc calls `onBack`.
 *
 * On commit, dimensions with an empty trimmed name or an empty values
 * list are stripped. If no usable dimensions remain, `onCommit` is
 * called with `undefined` so the parent can clear `strategy.matrix`
 * entirely.
 */
export function MatrixConfigPage({ initial, onCommit, onBack }: Props): React.JSX.Element {
  const [dimensions, setDimensions] = useState<Dimension[]>(() => {
    if (!initial) return [{ name: '', values: [] }];
    const dims: Dimension[] = [];
    for (const [key, value] of Object.entries(initial)) {
      if (key === 'include' || key === 'exclude') continue;
      if (Array.isArray(value)) {
        dims.push({
          name: key,
          values: value.map((v) => String(v)),
        });
      }
    }
    return dims.length === 0 ? [{ name: '', values: [] }] : dims;
  });

  // Focus index maps to positions:
  //   Each dimension contributes 2 positions (name, values)
  //   + 1 for "Add dimension"
  //   + 1 for "Done"
  // So positions count = dimensions.length * 2 + 2
  const [focusIndex, setFocusIndex] = useState(0);

  const positions = dimensions.length * 2 + 2;
  const isAddRow = focusIndex === positions - 2;
  const isDoneRow = focusIndex === positions - 1;

  function getFocusKind(): 'name' | 'values' | 'add' | 'done' {
    if (isDoneRow) return 'done';
    if (isAddRow) return 'add';
    return focusIndex % 2 === 0 ? 'name' : 'values';
  }

  function getFocusedDimensionIndex(): number {
    if (isAddRow || isDoneRow) return -1;
    return Math.floor(focusIndex / 2);
  }

  function commit(): void {
    const result: Matrix = {};
    // Preserve include/exclude from initial (not editable in this sub-page yet).
    if (initial?.include !== undefined) result.include = initial.include;
    if (initial?.exclude !== undefined) result.exclude = initial.exclude;

    for (const { name, values } of dimensions) {
      const trimmedName = name.trim();
      if (trimmedName === '' || values.length === 0) continue;
      result[trimmedName] = values;
    }
    if (Object.keys(result).length === 0) {
      onCommit(undefined);
    } else {
      onCommit(result);
    }
  }

  useInput((_input, key) => {
    if (key.tab) {
      setFocusIndex((i) => (i + 1) % positions);
      return;
    }
    if (key.escape) {
      onBack();
      return;
    }
    if (isAddRow && key.return) {
      setDimensions((d) => [...d, { name: '', values: [] }]);
      setFocusIndex(focusIndex + 2); // jump to new dimension's name
      return;
    }
    if (isDoneRow && key.return) {
      commit();
      return;
    }
  });

  function updateDimensionName(idx: number, name: string): void {
    setDimensions((d) => {
      const next = [...d];
      const existing = next[idx];
      if (existing === undefined) return d;
      next[idx] = { ...existing, name };
      return next;
    });
  }

  function updateDimensionValues(idx: number, values: string[]): void {
    setDimensions((d) => {
      const next = [...d];
      const existing = next[idx];
      if (existing === undefined) return d;
      next[idx] = { ...existing, values };
      return next;
    });
  }

  const focusedDimIdx = getFocusedDimensionIndex();
  const focusKind = getFocusKind();

  return (
    <Box flexDirection="column">
      <Text bold>Configure matrix</Text>
      <Text dimColor>Tab to cycle fields, Esc to cancel, Enter on Done to save</Text>

      {dimensions.map((dim, i) => (
        <Box key={i} flexDirection="column" marginTop={1}>
          <TextField
            label={`dimension ${i + 1} name`}
            value={dim.name}
            onChange={(v) => updateDimensionName(i, v)}
            placeholder="node-version"
            active={focusKind === 'name' && focusedDimIdx === i}
          />
          <StringList
            label="values"
            items={dim.values}
            onChange={(v) => updateDimensionValues(i, v)}
            placeholder="e.g. 20"
            active={focusKind === 'values' && focusedDimIdx === i}
          />
        </Box>
      ))}

      <Box marginTop={1}>
        {focusKind === 'add' ? (
          <Text color="cyan">{'> [+ Add dimension]'}</Text>
        ) : (
          <Text>{'  [+ Add dimension]'}</Text>
        )}
      </Box>

      <Box marginTop={1}>
        {focusKind === 'done' ? <Text color="cyan">{'> [Done]'}</Text> : <Text>{'  [Done]'}</Text>}
      </Box>
    </Box>
  );
}
