/**
 * Routes for built-in workflow templates.
 *
 *   GET /api/templates       — list all templates
 *   GET /api/templates/:id   — instantiate a template by id
 */

import { getTemplate, listTemplates, type TemplateId } from '@arc-workflows/core';
import { Hono } from 'hono';

import { errorResponse } from '../middleware/error-handler.js';

const VALID_IDS: readonly TemplateId[] = [
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

/**
 * Loose view of `getTemplate` so we can call it with a `TemplateId` value
 * narrowed via runtime check, without satisfying the per-id overload set.
 */
const getTemplateAny = getTemplate as (id: TemplateId) => ReturnType<typeof getTemplate>;

export const templatesRoute = new Hono();

templatesRoute.get('/', (c) => {
  return c.json({ templates: listTemplates() });
});

templatesRoute.get('/:id', (c) => {
  const id = c.req.param('id');
  if (!(VALID_IDS as readonly string[]).includes(id)) {
    return errorResponse(c, 400, `Unknown template id: ${id}`);
  }
  try {
    const workflow = getTemplateAny(id as TemplateId);
    return c.json({ workflow });
  } catch (err) {
    return errorResponse(c, 500, 'Failed to load template', [
      { message: err instanceof Error ? err.message : String(err) },
    ]);
  }
});
