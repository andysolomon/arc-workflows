/**
 * Routes for workflow operations.
 *
 *   POST /api/workflows/validate  — run the validation pipeline
 *   POST /api/workflows/generate  — render canonical YAML
 *   POST /api/workflows/parse     — parse canonical YAML to a Workflow
 *
 * NOTE on /parse: this endpoint accepts only the canonical (object-form)
 * GitHub Actions YAML produced by `generate()`. It does NOT normalize
 * the shorthand trigger syntax (e.g. `on: push`, `on: [push, pr]`).
 * Phase 2.5 will replace this stub with the full normalizing parser
 * from `@arc-workflows/core`.
 */

import { generate, validate, type GenerateOptions, type Workflow } from '@arc-workflows/core';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { parse as parseYaml } from 'yaml';

import { errorResponse } from '../middleware/error-handler.js';
import { generateBodySchema, parseBodySchema, validateBodySchema } from '../schemas/request.js';

export const workflowsRoute = new Hono();

workflowsRoute.post('/validate', zValidator('json', validateBodySchema), (c) => {
  const { workflow } = c.req.valid('json');
  const result = validate(workflow as unknown as Workflow);
  return c.json(result);
});

workflowsRoute.post('/generate', zValidator('json', generateBodySchema), (c) => {
  const { workflow, options } = c.req.valid('json');
  try {
    // exactOptionalPropertyTypes: strip undefined values out of the
    // Zod-inferred options shape before handing to core.
    const cleanOptions: GenerateOptions = {};
    if (options?.indent !== undefined) cleanOptions.indent = options.indent;
    if (options?.lineWidth !== undefined) cleanOptions.lineWidth = options.lineWidth;
    if (options?.header !== undefined) cleanOptions.header = options.header;
    const yaml = generate(workflow as unknown as Workflow, cleanOptions);
    return c.json({ yaml });
  } catch (err) {
    return errorResponse(c, 422, 'Failed to generate YAML', [
      { message: err instanceof Error ? err.message : String(err) },
    ]);
  }
});

/**
 * Parse a canonical GitHub Actions YAML string into a Workflow object.
 *
 * @todo Phase 2.5: replace with the normalizing parser that handles
 *   shorthand trigger forms (e.g., `on: push` as a bare string).
 */
workflowsRoute.post('/parse', zValidator('json', parseBodySchema), (c) => {
  const { yaml } = c.req.valid('json');
  try {
    const workflow = parseYaml(yaml) as unknown as Workflow;
    return c.json({ workflow });
  } catch (err) {
    return errorResponse(c, 422, 'Invalid YAML', [
      { message: err instanceof Error ? err.message : String(err) },
    ]);
  }
});
