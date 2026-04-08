import { describe, expect, it } from 'vitest';

import { validateConfig } from './validate-config.js';

describe('validateConfig', () => {
  it('treats undefined as a valid empty config', () => {
    const result = validateConfig(undefined);
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('treats null as a valid empty config', () => {
    const result = validateConfig(null);
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('accepts an empty object', () => {
    const result = validateConfig({});
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('accepts a valid defaultRunner', () => {
    const result = validateConfig({ defaultRunner: 'ubuntu-24.04' });
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('rejects a non-string defaultRunner', () => {
    const result = validateConfig({ defaultRunner: 42 });
    expect(result.valid).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]?.severity).toBe('error');
    expect(result.errors[0]?.path).toEqual(['defaultRunner']);
  });

  it('accepts a valid packageManager', () => {
    const result = validateConfig({ packageManager: 'npm' });
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('rejects an unknown packageManager value', () => {
    const result = validateConfig({ packageManager: 'cargo' });
    expect(result.valid).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]?.severity).toBe('error');
    expect(result.errors[0]?.path).toEqual(['packageManager']);
  });

  it('warns on unknown top-level keys but stays valid', () => {
    const result = validateConfig({ unknownKey: 'foo' });
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]?.severity).toBe('warning');
    expect(result.errors[0]?.rule).toBe('config-unknown-key');
  });

  it('accepts a valid templates object', () => {
    const result = validateConfig({
      templates: { 'ci-node': { nodeVersion: '20' } },
    });
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('rejects a non-object templates value', () => {
    const result = validateConfig({ templates: 'wrong' });
    expect(result.valid).toBe(false);
    expect(result.errors[0]?.path).toEqual(['templates']);
  });

  it('rejects a non-array requiredSteps value', () => {
    const result = validateConfig({ requiredSteps: 'wrong' });
    expect(result.valid).toBe(false);
    expect(result.errors[0]?.path).toEqual(['requiredSteps']);
  });

  it('accepts an empty requiredSteps array', () => {
    const result = validateConfig({ requiredSteps: [] });
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('rejects a string at the top level', () => {
    const result = validateConfig('a string');
    expect(result.valid).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]?.rule).toBe('config-shape');
  });

  it('rejects an array at the top level', () => {
    const result = validateConfig([]);
    expect(result.valid).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]?.rule).toBe('config-shape');
  });
});
