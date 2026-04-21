import React from 'react';
import { Box, Text } from 'ink';
import { listTemplates, type TemplateId } from '@arc-workflows/core';

type Choice = TemplateId | 'blank';

interface Props {
  choice: Choice;
}

export function TemplateDetails({ choice }: Props): React.JSX.Element {
  if (choice === 'blank') {
    return (
      <Box flexDirection="column" borderStyle="single" paddingX={1}>
        <Text bold>Blank workflow</Text>
        <Text dimColor>Start from scratch with an empty workflow.</Text>
      </Box>
    );
  }

  const template = listTemplates().find((t) => t.id === choice);
  if (!template) {
    return (
      <Box flexDirection="column" borderStyle="single" paddingX={1}>
        <Text dimColor>No template selected.</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" borderStyle="single" paddingX={1}>
      <Text bold>{template.name}</Text>
      <Text>{template.description}</Text>
      <Box marginTop={1}>
        <Text dimColor>Tags: </Text>
        {template.tags.map((tag, i) => (
          <Text key={tag} color="cyan">
            {i > 0 ? ', ' : ''}
            {tag}
          </Text>
        ))}
      </Box>
    </Box>
  );
}
