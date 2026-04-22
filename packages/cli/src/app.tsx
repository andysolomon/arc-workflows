import React from 'react';
import { Box, Text } from 'ink';
import { WizardProvider, useWizard } from './wizard/context.js';
import { WelcomePage } from './wizard/pages/welcome.js';
import { TemplateSelectPage } from './wizard/pages/template-select.js';
import { WorkflowNamePage } from './wizard/pages/workflow-name.js';
import { TriggersPage } from './wizard/pages/triggers.js';
import { JobsPage } from './wizard/pages/jobs.js';
import { JobConfigPage } from './wizard/pages/job-config.js';
import { StepsPage } from './wizard/pages/steps.js';
import { StepConfigPage } from './wizard/pages/step-config.js';
import { ConfirmPage } from './wizard/pages/confirm.js';
import { Layout } from './components/layout.js';

export function WizardRouter(): React.JSX.Element {
  const [state] = useWizard();
  const page = state.value as string;

  switch (page) {
    case 'welcome':
      return <WelcomePage />;
    case 'templateSelect':
      return <TemplateSelectPage />;
    case 'workflowName':
      return <WorkflowNamePage />;
    case 'triggers':
      return <TriggersPage />;
    case 'jobs':
      return <JobsPage />;
    case 'jobConfig':
      return <JobConfigPage />;
    case 'steps':
      return <StepsPage />;
    case 'stepConfig':
      return <StepConfigPage />;
    case 'confirm':
      return <ConfirmPage />;
    case 'done':
      return (
        <Box padding={1}>
          <Text color="green">Done.</Text>
        </Box>
      );
    default:
      return (
        <Box padding={1}>
          <Text>Unknown state: {page}</Text>
        </Box>
      );
  }
}

export function App(): React.JSX.Element {
  return (
    <WizardProvider>
      <Layout>
        <WizardRouter />
      </Layout>
    </WizardProvider>
  );
}
