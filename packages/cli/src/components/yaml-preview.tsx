import React from 'react';
import { Box } from 'ink';
import { useWizard } from '../wizard/context.js';
import { previewYaml } from '../lib/preview-yaml.js';
import { YamlLine } from './yaml-line.js';

export function YamlPreview(): React.JSX.Element {
  const [state] = useWizard();
  const yaml = previewYaml(state.context.workflow);
  const lines = yaml.split('\n');

  return (
    <Box flexDirection="column">
      {lines.map((line, i) => (
        <YamlLine key={i} line={line} />
      ))}
    </Box>
  );
}
