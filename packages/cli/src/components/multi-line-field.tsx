import React from 'react';
import { Box, Text, useInput } from 'ink';

export interface MultiLineFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  active?: boolean;
}

export function MultiLineField({
  label,
  value,
  onChange,
  placeholder,
  active = true,
}: MultiLineFieldProps): React.JSX.Element {
  useInput(
    (input, key) => {
      if (!active) return;
      if (key.return) {
        onChange(value + '\n');
        return;
      }
      if (key.backspace || key.delete) {
        onChange(value.slice(0, -1));
        return;
      }
      if (
        key.upArrow ||
        key.downArrow ||
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
        onChange(value + input);
      }
    },
    { isActive: active },
  );

  const hasValue = value.length > 0;
  const lines = hasValue ? value.split('\n') : [placeholder ?? ''];

  return (
    <Box flexDirection="column">
      <Text bold>{label}</Text>
      {lines.map((line, i) => (
        <Box key={i}>
          <Text>{i === 0 ? '> ' : '  '}</Text>
          {hasValue ? <Text>{line}</Text> : <Text dimColor>{line}</Text>}
        </Box>
      ))}
    </Box>
  );
}
