import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { listTemplates, type TemplateId, type TemplateMetadata } from '@arc-workflows/core';
import { useWizard } from '../context.js';
import { TemplateDetails } from './template-details.js';

type Choice = TemplateId | 'blank';

export function TemplateSelectPage(): React.JSX.Element {
  const [, send] = useWizard();
  const templates: readonly TemplateMetadata[] = listTemplates();
  const items: Choice[] = [...templates.map((t) => t.id), 'blank'];
  const [index, setIndex] = useState(0);

  useInput((_, key) => {
    if (key.upArrow) {
      setIndex((i) => Math.max(0, i - 1));
    } else if (key.downArrow) {
      setIndex((i) => Math.min(items.length - 1, i + 1));
    } else if (key.return) {
      const choice = items[index];
      if (choice === 'blank') {
        send({ type: 'SELECT_BLANK' });
      } else if (choice !== undefined) {
        send({ type: 'SELECT_TEMPLATE', templateId: choice });
      }
    }
  });

  const current = items[index] ?? 'blank';

  return (
    <Box flexDirection="column">
      <Text bold>Select a template</Text>
      <Box marginTop={1} flexDirection="column">
        {items.map((item, i) => {
          const label =
            item === 'blank'
              ? 'Blank workflow'
              : (templates.find((t) => t.id === item)?.name ?? item);
          const isActive = i === index;
          const colorProps = isActive ? { color: 'cyan' as const } : {};
          return (
            <Text key={item} {...colorProps}>
              {isActive ? '> ' : '  '}
              {label}
            </Text>
          );
        })}
      </Box>
      <Box marginTop={1}>
        <TemplateDetails choice={current} />
      </Box>
      <Box marginTop={1}>
        <Text dimColor>Up/Down to navigate, Enter to select</Text>
      </Box>
    </Box>
  );
}
