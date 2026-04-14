import { describe, expect, it } from 'vitest';
import { createActor } from 'xstate';
import { wizardMachine } from './machine.js';

describe('wizard state machine', () => {
  it('starts at welcome', () => {
    const actor = createActor(wizardMachine).start();
    expect(actor.getSnapshot().value).toBe('welcome');
    actor.stop();
  });

  it('transitions welcome -> templateSelect on SELECT_CREATE', () => {
    const actor = createActor(wizardMachine).start();
    actor.send({ type: 'SELECT_CREATE' });
    expect(actor.getSnapshot().value).toBe('templateSelect');
    actor.stop();
  });

  it('full happy path: welcome -> ... -> done', () => {
    const actor = createActor(wizardMachine).start();
    actor.send({ type: 'SELECT_CREATE' });
    actor.send({ type: 'SELECT_BLANK' });
    actor.send({ type: 'SET_NAME', name: 'CI' });
    actor.send({ type: 'NEXT' }); // workflowName -> triggers
    actor.send({ type: 'NEXT' }); // triggers -> jobs
    actor.send({ type: 'NEXT' }); // jobs -> confirm
    actor.send({ type: 'CONFIRM' });
    expect(actor.getSnapshot().value).toBe('done');
    expect(actor.getSnapshot().context.workflow.name).toBe('CI');
    actor.stop();
  });

  it('BACK transitions return to previous state', () => {
    const actor = createActor(wizardMachine).start();
    actor.send({ type: 'SELECT_CREATE' });
    expect(actor.getSnapshot().value).toBe('templateSelect');
    actor.send({ type: 'BACK' });
    expect(actor.getSnapshot().value).toBe('welcome');
    actor.stop();
  });

  it('SELECT_TEMPLATE loads template into context', () => {
    const actor = createActor(wizardMachine).start();
    actor.send({ type: 'SELECT_CREATE' });
    actor.send({ type: 'SELECT_TEMPLATE', templateId: 'ci-node' });
    const ctx = actor.getSnapshot().context;
    expect(ctx.templateId).toBe('ci-node');
    expect(ctx.workflow.name).toBeDefined();
    expect(ctx.workflow.jobs).toBeDefined();
    actor.stop();
  });

  it('SET_NAME updates workflow.name in context', () => {
    const actor = createActor(wizardMachine).start();
    actor.send({ type: 'SELECT_CREATE' });
    actor.send({ type: 'SELECT_BLANK' });
    actor.send({ type: 'SET_NAME', name: 'My Workflow' });
    expect(actor.getSnapshot().context.workflow.name).toBe('My Workflow');
    actor.stop();
  });

  it('ADD_JOB adds a job to the workflow context', () => {
    const actor = createActor(wizardMachine).start();
    actor.send({ type: 'SELECT_CREATE' });
    actor.send({ type: 'SELECT_BLANK' });
    actor.send({ type: 'NEXT' }); // workflowName -> triggers
    actor.send({ type: 'NEXT' }); // triggers -> jobs
    actor.send({
      type: 'ADD_JOB',
      id: 'build',
      job: {
        'runs-on': 'ubuntu-latest',
        steps: [{ run: 'echo hello' }],
      },
    });
    const jobs = actor.getSnapshot().context.workflow.jobs;
    expect(jobs).toBeDefined();
    expect(jobs!.build).toBeDefined();
    actor.stop();
  });

  it('EDIT_JOB transitions to jobConfig and sets currentJobId', () => {
    const actor = createActor(wizardMachine).start();
    actor.send({ type: 'SELECT_CREATE' });
    actor.send({ type: 'SELECT_BLANK' });
    actor.send({ type: 'NEXT' }); // workflowName -> triggers
    actor.send({ type: 'NEXT' }); // triggers -> jobs
    actor.send({ type: 'EDIT_JOB', id: 'build' });
    expect(actor.getSnapshot().value).toBe('jobConfig');
    expect(actor.getSnapshot().context.currentJobId).toBe('build');
    actor.stop();
  });

  it('navigates through job config -> steps -> step config and back', () => {
    const actor = createActor(wizardMachine).start();
    actor.send({ type: 'SELECT_CREATE' });
    actor.send({ type: 'SELECT_BLANK' });
    actor.send({ type: 'NEXT' }); // workflowName -> triggers
    actor.send({ type: 'NEXT' }); // triggers -> jobs
    actor.send({ type: 'EDIT_JOB', id: 'test' });
    expect(actor.getSnapshot().value).toBe('jobConfig');
    actor.send({ type: 'NEXT' }); // jobConfig -> steps
    expect(actor.getSnapshot().value).toBe('steps');
    actor.send({ type: 'EDIT_STEP', index: 0 });
    expect(actor.getSnapshot().value).toBe('stepConfig');
    expect(actor.getSnapshot().context.currentStepIndex).toBe(0);
    actor.send({ type: 'DONE_WITH_STEP' });
    expect(actor.getSnapshot().value).toBe('steps');
    actor.send({ type: 'DONE_WITH_JOB' });
    expect(actor.getSnapshot().value).toBe('jobs');
    actor.stop();
  });
});
