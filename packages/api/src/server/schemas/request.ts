/**
 * Zod schemas for request bodies.
 *
 * The boundary between Zod and the core types is intentionally loose:
 * we accept `unknown` for the workflow payload and let
 * `@arc-workflows/core` validate it. This avoids duplicating the
 * 1000-line GitHub Actions schema in Zod.
 */

import { z } from 'zod';

/**
 * `z.unknown()` is treated as an optional field by Zod, so a body of
 * `{}` would silently pass validation. Wrap it in a refinement that
 * also requires the key to be present.
 */
const requiredUnknown = z.unknown().refine((v) => v !== undefined, {
  message: 'Required',
});

export const validateBodySchema = z.object({
  workflow: requiredUnknown,
});

export const generateBodySchema = z.object({
  workflow: requiredUnknown,
  options: z
    .object({
      indent: z.number().optional(),
      lineWidth: z.number().optional(),
      header: z.string().optional(),
    })
    .optional(),
});

export const parseBodySchema = z.object({
  yaml: z.string(),
});
