import { Scalar } from 'yaml';
import { describe, expect, it } from 'vitest';

import { applyScalarStyle, needsLiteralBlock } from './formatters.js';

describe('needsLiteralBlock', () => {
  it('is false for single-line strings', () => {
    expect(needsLiteralBlock('npm ci')).toBe(false);
  });

  it('is true for multi-line strings', () => {
    expect(needsLiteralBlock('npm ci\nnpm test')).toBe(true);
  });
});

describe('applyScalarStyle', () => {
  it('sets PLAIN for GitHub Actions expressions', () => {
    const node = new Scalar('${{ secrets.X }}');
    applyScalarStyle(node, '${{ secrets.X }}');
    expect(node.type).toBe(Scalar.PLAIN);
  });

  it('sets BLOCK_LITERAL for multi-line strings', () => {
    const node = new Scalar('multi\nline');
    applyScalarStyle(node, 'multi\nline');
    expect(node.type).toBe(Scalar.BLOCK_LITERAL);
  });

  it('leaves plain string type unset', () => {
    const node = new Scalar('ubuntu-latest');
    applyScalarStyle(node, 'ubuntu-latest');
    expect(node.type).toBeUndefined();
  });
});
