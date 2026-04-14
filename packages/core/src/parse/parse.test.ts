import { describe, expect, it } from 'vitest';
import { parse } from './parse.js';
import { ParseError } from './errors.js';
import type { TemplateId } from '../index.js';
import { generate, getTemplate, validate } from '../index.js';

describe('parse', () => {
  it('parses a canonical YAML workflow', () => {
    const yaml = `
name: CI
on:
  push:
    branches:
      - main
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
`;
    const wf = parse(yaml);
    expect(wf.name).toBe('CI');
    expect(wf.on).toBeDefined();
    expect(wf.jobs.build).toBeDefined();
  });

  it('normalizes "on: push" shorthand', () => {
    const yaml = `
name: CI
on: push
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
`;
    const wf = parse(yaml);
    expect(wf.on).toEqual({ push: {} });
  });

  it('normalizes "on: [push, pull_request]" shorthand', () => {
    const yaml = `
name: CI
on: [push, pull_request]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
`;
    const wf = parse(yaml);
    expect(wf.on).toEqual({ push: {}, pull_request: {} });
  });

  it('throws ParseError on invalid YAML syntax', () => {
    expect(() => parse('{')).toThrow(ParseError);
  });

  it('throws ParseError on non-object YAML', () => {
    expect(() => parse('"just a string"')).toThrow(ParseError);
    expect(() => parse('- item1\n- item2')).toThrow(ParseError);
  });

  it('ParseError includes the source YAML', () => {
    try {
      parse('{');
    } catch (err) {
      expect(err).toBeInstanceOf(ParseError);
      expect((err as ParseError).source).toBe('{');
    }
  });

  it('round-trip: parse(generate(template)) produces a valid workflow', () => {
    const original = getTemplate('ci-node');
    const yaml = generate(original);
    const parsed = parse(yaml);

    // Semantic equivalence: parsed workflow should pass validation
    const result = validate(parsed);
    const errors = result.errors.filter((e) => e.severity === 'error');
    expect(errors).toEqual([]);

    // Key fields should match
    expect(parsed.name).toBe(original.name);
    expect(Object.keys(parsed.jobs)).toEqual(Object.keys(original.jobs));
  });

  it('round-trip works for all 10 built-in templates', () => {
    const templates: TemplateId[] = [
      'ci-node',
      'ci-python',
      'deploy-vercel',
      'deploy-aws',
      'release-semantic',
      'docker-build',
      'cron-task',
      'manual-dispatch',
      'reusable',
      'monorepo-ci',
    ];

    for (const id of templates) {
      // Cast needed: getTemplate uses per-id overloads, but return type is always Workflow
      const original = (getTemplate as (id: TemplateId) => ReturnType<typeof getTemplate>)(id);
      const yaml = generate(original);
      const parsed = parse(yaml);
      const result = validate(parsed);
      const errors = result.errors.filter((e) => e.severity === 'error');
      expect(errors, `Template ${id} failed round-trip validation`).toEqual([]);
    }
  });
});
