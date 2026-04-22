import React from 'react';
import { describe, expect, it } from 'vitest';
import { render } from 'ink-testing-library';
import { ConfirmPage } from './confirm.js';
import { TestWizardProvider, createTestActor } from '../context.js';

function navigateToConfirm(
  actor: ReturnType<typeof createTestActor>,
  { name = 'My Workflow' }: { name?: string } = {},
): void {
  actor.send({ type: 'SELECT_CREATE' });
  actor.send({ type: 'SELECT_BLANK' });
  actor.send({ type: 'SET_NAME', name });
  actor.send({ type: 'NEXT' }); // -> triggers
  actor.send({ type: 'NEXT' }); // -> jobs
  actor.send({ type: 'NEXT' }); // -> confirm
}

describe('ConfirmPage', () => {
  it('renders the review header and workflow name', () => {
    const actor = createTestActor();
    navigateToConfirm(actor, { name: 'My Workflow' });
    const { lastFrame } = render(
      <TestWizardProvider actor={actor}>
        <ConfirmPage />
      </TestWizardProvider>,
    );
    const frame = lastFrame() ?? '';
    expect(frame).toContain('Review and save');
    expect(frame).toContain('My Workflow');
    actor.stop();
  });

  it('defaults the save path to a slug of the workflow name', () => {
    const actor = createTestActor();
    navigateToConfirm(actor, { name: 'My Great Workflow' });
    const { lastFrame } = render(
      <TestWizardProvider actor={actor}>
        <ConfirmPage />
      </TestWizardProvider>,
    );
    const frame = lastFrame() ?? '';
    expect(frame).toContain('.github/workflows/my-great-workflow.yml');
    actor.stop();
  });

  it('falls back to "workflow" slug when name has no alphanumerics', () => {
    const actor = createTestActor();
    navigateToConfirm(actor, { name: '!!!' });
    const { lastFrame } = render(
      <TestWizardProvider actor={actor}>
        <ConfirmPage />
      </TestWizardProvider>,
    );
    const frame = lastFrame() ?? '';
    expect(frame).toContain('.github/workflows/workflow.yml');
    actor.stop();
  });

  it('renders both Save and Back actions plus keyboard hints', () => {
    const actor = createTestActor();
    navigateToConfirm(actor);
    const { lastFrame } = render(
      <TestWizardProvider actor={actor}>
        <ConfirmPage />
      </TestWizardProvider>,
    );
    const frame = lastFrame() ?? '';
    expect(frame).toContain('[Save and exit]');
    expect(frame).toContain('[Back to jobs]');
    expect(frame).toContain('Tab');
    expect(frame).toContain('Enter');
    expect(frame).toContain('Esc');
    actor.stop();
  });
});
