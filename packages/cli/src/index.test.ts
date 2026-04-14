import { describe, expect, it } from 'vitest';
import { wizardMachine } from './index.js';

describe('arc-workflows CLI public API', () => {
  it('exports the wizard machine', () => {
    expect(wizardMachine).toBeDefined();
    expect(wizardMachine.id).toBe('wizard');
  });
});
