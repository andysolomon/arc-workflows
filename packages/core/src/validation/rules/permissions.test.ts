import { describe, expect, it } from 'vitest';

import type { Workflow } from '../../schema/index.js';
import { permissionsRule } from './permissions.js';

function withPermissions(p: NonNullable<Workflow['permissions']>): Workflow {
  return {
    on: { push: { branches: ['main'] } },
    permissions: p,
    jobs: {
      a: { 'runs-on': 'ubuntu-latest', steps: [{ run: 'echo hi' }] },
    },
  };
}

describe('permissionsRule', () => {
  it('returns no errors for a valid scope/value map', () => {
    expect(
      permissionsRule(withPermissions({ contents: 'read', 'pull-requests': 'write' })),
    ).toEqual([]);
  });

  it("accepts 'read-all' / 'write-all' shorthands", () => {
    expect(permissionsRule(withPermissions('read-all'))).toEqual([]);
    expect(permissionsRule(withPermissions('write-all'))).toEqual([]);
  });

  it('accepts an empty object', () => {
    expect(permissionsRule(withPermissions({}))).toEqual([]);
  });

  it('flags an unknown scope', () => {
    const errors = permissionsRule(
      withPermissions({ 'invalid-scope': 'read' } as unknown as NonNullable<
        Workflow['permissions']
      >),
    );
    expect(errors).toHaveLength(1);
    expect(errors[0]).toMatchObject({
      path: ['permissions', 'invalid-scope'],
      severity: 'error',
      rule: 'permissions',
    });
  });

  it('flags an invalid permission value', () => {
    const errors = permissionsRule(
      withPermissions({ contents: 'maybe' } as unknown as NonNullable<Workflow['permissions']>),
    );
    expect(errors).toHaveLength(1);
    expect(errors[0]?.path).toEqual(['permissions', 'contents']);
    expect(errors[0]?.message).toMatch(/Invalid permission value/);
  });

  it('validates per-job permissions across multiple jobs', () => {
    const wf: Workflow = {
      on: { push: { branches: ['main'] } },
      jobs: {
        good: {
          'runs-on': 'ubuntu-latest',
          permissions: { contents: 'read' },
          steps: [{ run: 'echo hi' }],
        },
        bad: {
          'runs-on': 'ubuntu-latest',
          permissions: {
            'not-a-scope': 'read',
          } as unknown as NonNullable<Workflow['permissions']>,
          steps: [{ run: 'echo hi' }],
        },
      },
    };
    const errors = permissionsRule(wf);
    expect(errors).toHaveLength(1);
    expect(errors[0]?.path).toEqual(['jobs', 'bad', 'permissions', 'not-a-scope']);
  });
});
