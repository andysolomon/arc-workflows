import { describe, expectTypeOf, test } from 'vitest';

import type { PermissionScope, PermissionValue, Permissions } from './permissions.js';

describe('Permissions union', () => {
  test('PermissionValue is the closed union read | write | none', () => {
    expectTypeOf<PermissionValue>().toEqualTypeOf<'read' | 'write' | 'none'>();
  });

  test('valid permission scopes compile', () => {
    const _ok: Partial<Record<PermissionScope, PermissionValue>> = {
      contents: 'read',
      'pull-requests': 'write',
      'id-token': 'write',
      attestations: 'write',
      models: 'read',
    };
    void _ok;
  });

  test('invalid permission scope produces a type error', () => {
    const _bad: Partial<Record<PermissionScope, PermissionValue>> = {
      // @ts-expect-error — 'not-a-scope' is not a valid PermissionScope
      'not-a-scope': 'read',
    };
    void _bad;
  });

  test('invalid permission value produces a type error', () => {
    const _bad: Permissions = {
      // @ts-expect-error — 'maybe' is not a valid PermissionValue
      contents: 'maybe',
    };
    void _bad;
  });

  test('shorthand string forms are accepted', () => {
    const _readAll: Permissions = 'read-all';
    const _writeAll: Permissions = 'write-all';
    const _none: Permissions = {};
    void _readAll;
    void _writeAll;
    void _none;
  });
});
