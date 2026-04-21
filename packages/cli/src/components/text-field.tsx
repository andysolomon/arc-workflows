import React from 'react';
import { Box, Text, useInput } from 'ink';

export interface TextFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onSubmit?: (value: string) => void;
  placeholder?: string;
  error?: string;
  active?: boolean;
}

export function TextField({
  label,
  value,
  onChange,
  onSubmit,
  placeholder,
  error,
  active = true,
}: TextFieldProps): React.JSX.Element {
  useInput(
    (input, key) => {
      if (!active) return;
      if (key.return && onSubmit) {
        onSubmit(value);
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
  const display = hasValue ? value : (placeholder ?? '');

  return (
    <Box flexDirection="column">
      <Text bold>{label}</Text>
      <Box>
        <Text>{'> '}</Text>
        {hasValue ? <Text>{display}</Text> : <Text dimColor>{display}</Text>}
      </Box>
      {error !== undefined && error !== '' && <Text color="red">{error}</Text>}
    </Box>
  );
}
