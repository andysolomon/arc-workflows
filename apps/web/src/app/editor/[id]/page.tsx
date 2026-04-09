import * as React from 'react';
import {
  COMMON_ACTIONS,
  getTemplate,
  type TemplateId,
  type Workflow,
} from '@arc-workflows/core';
import { EditorClient } from '@/components/editor/editor-client';
import { notFound } from 'next/navigation';

interface Props {
  params: Promise<{ id: string }>;
}

function loadTemplate(id: string): Workflow | null {
  switch (id as TemplateId) {
    case 'ci-node':
      return getTemplate('ci-node');
    case 'ci-python':
      return getTemplate('ci-python');
    case 'deploy-vercel':
      return getTemplate('deploy-vercel');
    case 'deploy-aws':
      return getTemplate('deploy-aws');
    case 'release-semantic':
      return getTemplate('release-semantic');
    case 'docker-build':
      return getTemplate('docker-build');
    case 'cron-task':
      return getTemplate('cron-task');
    case 'manual-dispatch':
      return getTemplate('manual-dispatch');
    case 'reusable':
      return getTemplate('reusable');
    case 'monorepo-ci':
      return getTemplate('monorepo-ci');
    default:
      return null;
  }
}

export default async function EditorPage({ params }: Props): Promise<React.JSX.Element> {
  const { id } = await params;
  const workflow = loadTemplate(id);
  if (!workflow) notFound();
  return <EditorClient initialWorkflow={workflow} commonActions={COMMON_ACTIONS} />;
}
