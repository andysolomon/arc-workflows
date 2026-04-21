import React from 'react';
import { Text } from 'ink';

const KEY_RE = /^(\s*)([A-Za-z_][\w-]*):(.*)$/;
const COMMENT_RE = /^(\s*)(#.*)$/;
const EXPR_RE = /(\$\{\{[\s\S]*?\}\})/g;

interface Props {
  line: string;
}

export function YamlLine({ line }: Props): React.JSX.Element {
  const commentMatch = COMMENT_RE.exec(line);
  if (commentMatch) {
    return (
      <Text>
        {commentMatch[1]}
        <Text color="gray">{commentMatch[2]}</Text>
      </Text>
    );
  }

  const keyMatch = KEY_RE.exec(line);
  if (keyMatch) {
    const indent = keyMatch[1] ?? '';
    const key = keyMatch[2] ?? '';
    const rest = keyMatch[3] ?? '';
    return (
      <Text>
        {indent}
        <Text color="cyan">{key}</Text>
        <Text>:</Text>
        <ValueSpan value={rest} />
      </Text>
    );
  }

  return (
    <Text>
      <ValueSpan value={line} />
    </Text>
  );
}

function ValueSpan({ value }: { value: string }): React.JSX.Element {
  // Split on ${{ ... }} expressions
  const parts = value.split(EXPR_RE);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('${{') && part.endsWith('}}')) {
          return (
            <Text key={i} color="yellow">
              {part}
            </Text>
          );
        }
        return (
          <Text key={i} color="green">
            {part}
          </Text>
        );
      })}
    </>
  );
}
