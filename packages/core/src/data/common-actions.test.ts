import { describe, expect, it } from 'vitest';
import { COMMON_ACTIONS, findActionByName } from './common-actions.js';

describe('common-actions registry', () => {
  it('has at least 20 entries', () => {
    expect(COMMON_ACTIONS.length).toBeGreaterThanOrEqual(20);
  });

  it('every entry has name, version, description, tags, and inputs array', () => {
    for (const a of COMMON_ACTIONS) {
      expect(a.name).toMatch(/^[\w-]+\/[\w./-]+$/);
      expect(a.version).toMatch(/^v\d+$/);
      expect(a.description.length).toBeGreaterThan(0);
      expect(Array.isArray(a.tags)).toBe(true);
      expect(Array.isArray(a.inputs)).toBe(true);
    }
  });

  it('findActionByName resolves a known action', () => {
    expect(findActionByName('actions/checkout')?.version).toBe('v4');
  });

  it('findActionByName returns undefined for unknown actions', () => {
    expect(findActionByName('not/a-real-action')).toBeUndefined();
  });
});
