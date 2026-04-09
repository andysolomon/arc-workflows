/**
 * `@arc-workflows/core` — schema, validation, YAML generation, and
 * built-in templates for GitHub Actions workflows.
 *
 * The package re-exports five submodules:
 *
 *  - **schema** — TypeScript types modeling the GitHub Actions spec
 *    (`Workflow`, `Job`, `Step`, triggers, permissions, runners, the
 *    `Expression<T>` brand and the `expr` / `isExpressionString`
 *    helpers).
 *  - **validation** — `validate()` runs an 8-rule pipeline that
 *    collects every error and warning in a single pass, plus the
 *    `formatPath()` helper for displaying structured paths.
 *  - **generate** — `generate()` renders a `Workflow` to YAML and
 *    `writeWorkflow()` writes it to disk in the canonical
 *    `.github/workflows/` location.
 *  - **templates** — 10 built-in templates exposed via `getTemplate()`
 *    and `listTemplates()`.
 *  - **config** — `loadConfig()` discovers and reads
 *    `arc.config.{json,js,ts}` files for project-level overrides.
 *
 * @packageDocumentation
 */

export * from './schema/index.js';
export * from './validation/index.js';
export * from './generate/index.js';
export * from './templates/index.js';
export * from './config/index.js';
export * from './data/common-actions.js';
