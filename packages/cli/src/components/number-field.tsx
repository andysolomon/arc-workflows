import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';

export interface NumberFieldProps {
  label: string;
  value: number | null;
  onChange: (value: number | null) => void;
  min?: number;
  max?: number;
  active?: boolean;
}

export function NumberField({
  label,
  value,
  onChange,
  min,
  max,
  active = true,
}: NumberFieldProps): React.JSX.Element {
  const [raw, setRaw] = useState<string>(value === null ? '' : value.toString());
  const [error, setError] = useState('');

  function evaluate(next: string): void {
    setRaw(next);
    if (next === '') {
      setError('');
      onChange(null);
      return;
    }
    const n = Number(next);
    if (Number.isNaN(n)) {
      setError('Not a number');
      onChange(null);
      return;
    }
    if (min !== undefined && n < min) {
      setError(`Min: ${min}`);
      onChange(n);
      return;
    }
    if (max !== undefined && n > max) {
      setError(`Max: ${max}`);
      onChange(n);
      return;
    }
    setError('');
    onChange(n);
  }

  useInput(
    (input, key) => {
      if (!active) return;
      if (key.backspace || key.delete) {
        evaluate(raw.slice(0, -1));
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
        key.ctrl ||
        key.return
      ) {
        return;
      }
      if (input && /^[0-9.-]$/.test(input)) {
        evaluate(raw + input);
      }
    },
    { isActive: active },
  );

  return (
    <Box flexDirection="column">
      <Text bold>{label}</Text>
      <Box>
        <Text>{'> '}</Text>
        {raw.length > 0 ? <Text>{raw}</Text> : <Text dimColor>(empty)</Text>}
      </Box>
      {error !== '' && <Text color="red">{error}</Text>}
    </Box>
  );
}
