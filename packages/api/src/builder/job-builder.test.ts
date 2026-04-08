import { describe, expect, it } from 'vitest';

import { job, JobBuilder } from './job-builder.js';
import { matrix } from './matrix-builder.js';
import { step } from './step-builder.js';

describe('JobBuilder', () => {
  it('throws if runs-on is missing', () => {
    const j = new JobBuilder('build');
    expect(() => j.build()).toThrow(/runs-on/);
  });

  it('sets runs-on', () => {
    const j = job('build').runsOn('ubuntu-latest').build();
    expect(j['runs-on']).toBe('ubuntu-latest');
  });

  it('accepts needs as a string or array', () => {
    const a = job('a').runsOn('ubuntu-latest').needs('lint').build();
    expect(a.needs).toBe('lint');
    const b = job('b').runsOn('ubuntu-latest').needs(['lint', 'test']).build();
    expect(b.needs).toEqual(['lint', 'test']);
  });

  it('appends steps in order', () => {
    const j = job('build')
      .runsOn('ubuntu-latest')
      .step(step().run('a'))
      .step(step().run('b'))
      .step(step().run('c'))
      .build();
    expect(j.steps).toHaveLength(3);
    expect(j.steps.map((s) => ('run' in s ? s.run : s.uses))).toEqual(['a', 'b', 'c']);
  });

  it('matrix() sets strategy.matrix', () => {
    const j = job('test')
      .runsOn('ubuntu-latest')
      .matrix(matrix().dimension('node', [18, 20]).failFast(false))
      .step(step().run('echo'))
      .build();
    expect(j.strategy?.matrix).toEqual({ node: [18, 20] });
    expect(j.strategy?.['fail-fast']).toBe(false);
  });

  it('supports the full method surface', () => {
    const j = job('build')
      .name('Build')
      .runsOn('ubuntu-latest')
      .if('always()')
      .permissions({ contents: 'read' })
      .environment({ name: 'prod' })
      .concurrency('group-1')
      .env({ K: 'v' })
      .defaults({ run: { shell: 'bash' } })
      .container({ image: 'node:20' })
      .services({ db: { image: 'postgres' } })
      .outputs({ ver: '${{ steps.x.outputs.v }}' })
      .timeoutMinutes(30)
      .continueOnError(true)
      .step(step().run('echo'))
      .build();

    expect(j.name).toBe('Build');
    expect(j.if).toBe('always()');
    expect(j.permissions).toEqual({ contents: 'read' });
    expect(j.environment).toEqual({ name: 'prod' });
    expect(j.concurrency).toBe('group-1');
    expect(j.env).toEqual({ K: 'v' });
    expect(j.defaults).toEqual({ run: { shell: 'bash' } });
    expect(j.container).toEqual({ image: 'node:20' });
    expect(j.services).toEqual({ db: { image: 'postgres' } });
    expect(j.outputs).toEqual({ ver: '${{ steps.x.outputs.v }}' });
    expect(j['timeout-minutes']).toBe(30);
    expect(j['continue-on-error']).toBe(true);
  });
});
