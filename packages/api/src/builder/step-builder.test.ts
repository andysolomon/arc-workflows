import { describe, expect, it } from 'vitest';

import { step } from './step-builder.js';

describe('StepBuilder', () => {
  it('builds an action step', () => {
    const s = step().uses('actions/checkout@v4').with({ ref: 'main' }).build();
    expect('uses' in s && s.uses).toBe('actions/checkout@v4');
    expect('with' in s && s.with).toEqual({ ref: 'main' });
  });

  it('builds a run step', () => {
    const s = step().run('npm test').shell('bash').build();
    expect('run' in s && s.run).toBe('npm test');
    expect('run' in s && s.shell).toBe('bash');
  });

  it('throws when calling .uses() after .run()', () => {
    expect(() => step().run('x').uses('y')).toThrow(/either an action or a run/);
  });

  it('throws when calling .run() after .uses()', () => {
    expect(() => step().uses('y').run('x')).toThrow(/either an action or a run/);
  });

  it('throws when calling .with() on a run step', () => {
    expect(() => step().run('x').with({ a: 'b' })).toThrow(/with\(\) on a run step/);
  });

  it('throws when calling .shell() on an action step', () => {
    expect(() => step().uses('y').shell('bash')).toThrow(/shell\(\) on an action step/);
  });

  it('throws on .build() if neither .uses() nor .run() called', () => {
    expect(() => step().name('x').build()).toThrow(/either \.uses\(\) or \.run\(\)/);
  });

  it('preserves shared step base fields', () => {
    const s = step()
      .name('Run tests')
      .id('test')
      .if('always()')
      .env({ NODE_ENV: 'test' })
      .continueOnError(false)
      .timeoutMinutes(10)
      .workingDirectory('./packages/api')
      .run('npm test')
      .build();
    expect(s.name).toBe('Run tests');
    expect(s.id).toBe('test');
    expect(s.if).toBe('always()');
    expect(s.env).toEqual({ NODE_ENV: 'test' });
    expect(s['continue-on-error']).toBe(false);
    expect(s['timeout-minutes']).toBe(10);
    expect(s['working-directory']).toBe('./packages/api');
  });
});
