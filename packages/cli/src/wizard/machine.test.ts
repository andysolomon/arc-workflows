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
    actor.send({ type: 'CONFIRM', outputPath: '.github/workflows/ci.yml' }); // -> done
    expect(actor.getSnapshot().value).toBe('done');
    expect(actor.getSnapshot().context.outputPath).toBe('.github/workflows/ci.yml');
    actor.stop();
  });

  it('CONFIRM stores outputPath in context', () => {
    const actor = createActor(wizardMachine);
    actor.start();
    actor.send({ type: 'SELECT_CREATE' });
    actor.send({ type: 'SELECT_BLANK' });
    actor.send({ type: 'NEXT' }); // -> triggers
    actor.send({ type: 'NEXT' }); // -> jobs
    actor.send({ type: 'NEXT' }); // -> confirm
    expect(actor.getSnapshot().context.outputPath).toBeNull();
    actor.send({ type: 'CONFIRM', outputPath: '/tmp/my-workflow.yml' });
    expect(actor.getSnapshot().value).toBe('done');
    expect(actor.getSnapshot().context.outputPath).toBe('/tmp/my-workflow.yml');
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

  it('REMOVE_JOB removes a job from workflow.jobs', () => {
    const actor = createActor(wizardMachine);
    actor.start();
    actor.send({ type: 'SELECT_CREATE' });
    actor.send({ type: 'SELECT_BLANK' });
    actor.send({ type: 'NEXT' }); // -> triggers
    actor.send({ type: 'NEXT' }); // -> jobs
    actor.send({
      type: 'ADD_JOB',
      id: 'build',
      job: { 'runs-on': 'ubuntu-latest', steps: [] },
    });
    actor.send({
      type: 'ADD_JOB',
      id: 'test',
      job: { 'runs-on': 'ubuntu-latest', steps: [] },
    });
    expect(Object.keys(actor.getSnapshot().context.workflow.jobs ?? {})).toEqual(['build', 'test']);
    actor.send({ type: 'REMOVE_JOB', id: 'build' });
    expect(Object.keys(actor.getSnapshot().context.workflow.jobs ?? {})).toEqual(['test']);
    actor.stop();
  });

  it('REMOVE_JOB is a no-op for an unknown job id', () => {
    const actor = createActor(wizardMachine);
    actor.start();
    actor.send({ type: 'SELECT_CREATE' });
    actor.send({ type: 'SELECT_BLANK' });
    actor.send({ type: 'NEXT' }); // -> triggers
    actor.send({ type: 'NEXT' }); // -> jobs
    actor.send({
      type: 'ADD_JOB',
      id: 'build',
      job: { 'runs-on': 'ubuntu-latest', steps: [] },
    });
    actor.send({ type: 'REMOVE_JOB', id: 'nope' });
    expect(Object.keys(actor.getSnapshot().context.workflow.jobs ?? {})).toEqual(['build']);
    actor.stop();
  });

  it('UPDATE_STEP replaces a step at the given index', () => {
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
        steps: [{ run: 'echo one' }, { run: 'echo two' }],
      },
    });
    actor.send({ type: 'EDIT_JOB', id: 'build' }); // -> jobConfig
    actor.send({ type: 'NEXT' }); // -> steps
    actor.send({
      type: 'UPDATE_STEP',
      jobId: 'build',
      stepIndex: 1,
      step: { run: 'echo updated' },
    });
    const job = actor.getSnapshot().context.workflow.jobs?.build;
    expect(job).toBeDefined();
    if (job && 'steps' in job && job.steps) {
      expect(job.steps[1]).toEqual({ run: 'echo updated' });
    }
    actor.stop();
  });

  it('REMOVE_STEP removes a step at the given index', () => {
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
        steps: [{ run: 'echo one' }, { run: 'echo two' }, { run: 'echo three' }],
      },
    });
    actor.send({ type: 'EDIT_JOB', id: 'build' }); // -> jobConfig
    actor.send({ type: 'NEXT' }); // -> steps
    actor.send({ type: 'REMOVE_STEP', jobId: 'build', stepIndex: 1 });
    const job = actor.getSnapshot().context.workflow.jobs?.build;
    expect(job).toBeDefined();
    if (job && 'steps' in job && job.steps) {
      expect(job.steps).toHaveLength(2);
      expect(job.steps[0]).toEqual({ run: 'echo one' });
      expect(job.steps[1]).toEqual({ run: 'echo three' });
    }
    actor.stop();
  });

  it('starts at jobs with hydrated context when input has workflow + sourcePath', () => {
    const actor = createActor(wizardMachine, {
      input: {
        workflow: {
          name: 'CI',
          on: { push: {} },
          jobs: {
            build: {
              'runs-on': 'ubuntu-latest',
              steps: [{ run: 'echo hi' }],
            },
          },
        },
        sourcePath: '/tmp/ci.yml',
      },
    });
    actor.start();
    expect(actor.getSnapshot().value).toBe('jobs');
    expect(actor.getSnapshot().context.workflow.name).toBe('CI');
    expect(actor.getSnapshot().context.outputPath).toBe('/tmp/ci.yml');
    expect(Object.keys(actor.getSnapshot().context.workflow.jobs ?? {})).toEqual(['build']);
    actor.stop();
  });

  it('falls back to welcome when input has sourcePath but no jobs', () => {
    const actor = createActor(wizardMachine, {
      input: {
        workflow: { name: 'Empty' },
        sourcePath: '/tmp/empty.yml',
      },
    });
    actor.start();
    expect(actor.getSnapshot().value).toBe('welcome');
    actor.stop();
  });

  it('REMOVE_STEP is a no-op for an unknown job', () => {
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
        steps: [{ run: 'echo one' }],
      },
    });
    actor.send({ type: 'EDIT_JOB', id: 'build' });
    actor.send({ type: 'NEXT' }); // -> steps
    actor.send({ type: 'REMOVE_STEP', jobId: 'ghost', stepIndex: 0 });
    const job = actor.getSnapshot().context.workflow.jobs?.build;
    if (job && 'steps' in job && job.steps) {
      expect(job.steps).toHaveLength(1);
    }
    actor.stop();
  });
});
