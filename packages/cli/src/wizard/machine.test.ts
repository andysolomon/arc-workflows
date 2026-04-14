import { describe, expect, it } from 'vitest';
import { createActor } from 'xstate';
import { wizardMachine } from './machine.js';

describe('wizard state machine', () => {
  it('starts in welcome state', () => {
    const actor = createActor(wizardMachine);
    actor.start();
    expect(actor.getSnapshot().value).toBe('welcome');
    actor.stop();
  });

  it('transitions welcome -> templateSelect on SELECT_CREATE', () => {
    const actor = createActor(wizardMachine);
    actor.start();
    actor.send({ type: 'SELECT_CREATE' });
    expect(actor.getSnapshot().value).toBe('templateSelect');
    actor.stop();
  });

  it('full happy path: welcome -> ... -> done', () => {
    const actor = createActor(wizardMachine);
    actor.start();
    actor.send({ type: 'SELECT_CREATE' });
    actor.send({ type: 'SELECT_TEMPLATE', templateId: 'ci-node' });
    expect(actor.getSnapshot().context.templateId).toBe('ci-node');
    actor.send({ type: 'SET_NAME', name: 'CI' });
    actor.send({ type: 'NEXT' }); // -> triggers
    actor.send({ type: 'NEXT' }); // -> jobs
    actor.send({ type: 'NEXT' }); // -> confirm
    actor.send({ type: 'CONFIRM' }); // -> done
    expect(actor.getSnapshot().value).toBe('done');
    actor.stop();
  });

  it('BACK from templateSelect returns to welcome', () => {
    const actor = createActor(wizardMachine);
    actor.start();
    actor.send({ type: 'SELECT_CREATE' });
    expect(actor.getSnapshot().value).toBe('templateSelect');
    actor.send({ type: 'BACK' });
    expect(actor.getSnapshot().value).toBe('welcome');
    actor.stop();
  });

  it('BACK from workflowName returns to templateSelect', () => {
    const actor = createActor(wizardMachine);
    actor.start();
    actor.send({ type: 'SELECT_CREATE' });
    actor.send({ type: 'SELECT_BLANK' });
    expect(actor.getSnapshot().value).toBe('workflowName');
    actor.send({ type: 'BACK' });
    expect(actor.getSnapshot().value).toBe('templateSelect');
    actor.stop();
  });

  it('BACK from triggers returns to workflowName', () => {
    const actor = createActor(wizardMachine);
    actor.start();
    actor.send({ type: 'SELECT_CREATE' });
    actor.send({ type: 'SELECT_BLANK' });
    actor.send({ type: 'NEXT' }); // -> triggers
    expect(actor.getSnapshot().value).toBe('triggers');
    actor.send({ type: 'BACK' });
    expect(actor.getSnapshot().value).toBe('workflowName');
    actor.stop();
  });

  it('BACK from jobs returns to triggers', () => {
    const actor = createActor(wizardMachine);
    actor.start();
    actor.send({ type: 'SELECT_CREATE' });
    actor.send({ type: 'SELECT_BLANK' });
    actor.send({ type: 'NEXT' }); // -> triggers
    actor.send({ type: 'NEXT' }); // -> jobs
    expect(actor.getSnapshot().value).toBe('jobs');
    actor.send({ type: 'BACK' });
    expect(actor.getSnapshot().value).toBe('triggers');
    actor.stop();
  });

  it('BACK from confirm returns to jobs', () => {
    const actor = createActor(wizardMachine);
    actor.start();
    actor.send({ type: 'SELECT_CREATE' });
    actor.send({ type: 'SELECT_BLANK' });
    actor.send({ type: 'NEXT' }); // -> triggers
    actor.send({ type: 'NEXT' }); // -> jobs
    actor.send({ type: 'NEXT' }); // -> confirm
    expect(actor.getSnapshot().value).toBe('confirm');
    actor.send({ type: 'BACK' });
    expect(actor.getSnapshot().value).toBe('jobs');
    actor.stop();
  });

  it('SET_NAME updates workflow.name in context', () => {
    const actor = createActor(wizardMachine);
    actor.start();
    actor.send({ type: 'SELECT_CREATE' });
    actor.send({ type: 'SELECT_TEMPLATE', templateId: 'ci-node' });
    actor.send({ type: 'SET_NAME', name: 'My CI' });
    expect(actor.getSnapshot().context.workflow.name).toBe('My CI');
    actor.stop();
  });

  it('ADD_JOB adds a job to workflow.jobs', () => {
    const actor = createActor(wizardMachine);
    actor.start();
    actor.send({ type: 'SELECT_CREATE' });
    actor.send({ type: 'SELECT_BLANK' });
    actor.send({ type: 'NEXT' }); // -> triggers
    actor.send({ type: 'NEXT' }); // -> jobs

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
    expect(jobs?.build).toBeDefined();
    actor.stop();
  });

  it('SELECT_BLANK sets templateId to null', () => {
    const actor = createActor(wizardMachine);
    actor.start();
    actor.send({ type: 'SELECT_CREATE' });
    actor.send({ type: 'SELECT_BLANK' });
    expect(actor.getSnapshot().context.templateId).toBeNull();
    actor.stop();
  });
});
