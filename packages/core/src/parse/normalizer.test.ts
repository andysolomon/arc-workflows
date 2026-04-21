import { describe, expect, it } from 'vitest';
import { normalizeTriggers } from './normalizer.js';

describe('normalizeTriggers', () => {
  it('normalizes a bare string to an object', () => {
    expect(normalizeTriggers('push')).toEqual({ push: {} });
  });

  it('normalizes an array of strings to an object', () => {
    expect(normalizeTriggers(['push', 'pull_request'])).toEqual({
      push: {},
      pull_request: {},
    });
  });

  it('passes through a canonical object unchanged', () => {
    const obj = { push: { branches: ['main'] }, schedule: [{ cron: '0 0 * * *' }] };
    expect(normalizeTriggers(obj)).toEqual(obj);
  });

  it('returns empty object for null', () => {
    expect(normalizeTriggers(null)).toEqual({});
  });

  it('returns empty object for undefined', () => {
    expect(normalizeTriggers(undefined)).toEqual({});
  });

  it('skips non-string items in an array', () => {
    expect(normalizeTriggers(['push', 42, 'pull_request'])).toEqual({
      push: {},
      pull_request: {},
    });
  });

  it('returns empty object for non-object/non-string/non-array', () => {
    expect(normalizeTriggers(42)).toEqual({});
  });
});
