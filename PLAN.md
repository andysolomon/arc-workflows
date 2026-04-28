# arc-workflows — Development Plan

A tool for creating GitHub Actions workflows through a wizard-style CLI, a programmatic TypeScript API, a Hono REST server, and a Next.js visual editor.

> **Status:** All phases complete. See [`CHANGELOG.md`](./CHANGELOG.md) for releases.

## Architecture

```
arc-workflows/
├── packages/
│   ├── core/        # @arc-workflows/core — schema, validation, generation, parse, templates
│   ├── cli/         # arc-workflows — Ink-based wizard with create + edit
│   └── api/         # @arc-workflows/api — fluent builder + Hono REST server
└── apps/
    └── web/         # @arc-workflows/web — Next.js 15 + React Flow + Monaco visual editor
```

The CLI, API, and web app all consume `@arc-workflows/core`. No logic duplication.

## Phase summary

### Phase 0 — Scaffold

pnpm workspaces, TypeScript strict mode (`exactOptionalPropertyTypes`), Vitest, ESLint flat config, Prettier, husky, commitlint, semantic-release, GitHub Actions release workflow.

### Phase 1 — Core engine (`@arc-workflows/core`)

Workflow schema (full GitHub Actions spec coverage with `Record<string, unknown>` escape hatches for unknowns), 8-rule validation pipeline (`required-fields`, `action-refs`, `job-deps`, `cron`, `matrix`, `permissions`, `expressions`, `runners`), YAML generator built on `eemeli/yaml` with custom Scalar handling for `${{ }}` expressions, 10 built-in templates (`ci-node`, `ci-python`, `deploy-vercel`, `deploy-aws`, `release-semantic`, `docker-build`, `cron-task`, `manual-dispatch`, `reusable`, `monorepo-ci`), and a YAML parser with trigger-shorthand normalization. Round-trip (`parse(generate(workflow))`) is covered for all templates.

### Phase 2 — CLI wizard (`arc-workflows`)

Ink (React-for-CLIs) with XState v5 state machine. Pages: welcome → template select → workflow name → triggers → jobs → job config → steps → step config → confirm. Components: split-pane layout, live YAML preview, expression autocomplete, action picker, matrix builder, key-value editor. Subcommands: `create` (default), `validate`, `list-templates`, `generate`. E2E test walks the full happy path via programmatic XState dispatch.

### Phase 2.5 — Edit mode

`arc-workflows edit <file>` parses existing YAML, hydrates the wizard machine via XState `input`, lands at the jobs page, and writes back on confirm. Comments and key order are not preserved (documented in the CLI README).

### Phase 3 — API layer (`@arc-workflows/api`)

Fluent builder (`workflow().on().job().step().toYAML()`) and a Hono REST server with 5 Zod-validated endpoints: `GET /api/templates`, `GET /api/templates/:id`, `POST /api/workflows/validate`, `POST /api/workflows/generate`, `POST /api/workflows/parse`. Builder + REST + core round-trip is covered end-to-end.

### Phase 4 — Web app (`@arc-workflows/web`)

Next.js 15 (App Router) + Tailwind v4 + shadcn/ui. Template gallery on `/`, visual editor on `/editor/[id]` with React Flow DAG view of jobs and `needs` edges, sidebar step configurator, Monaco-powered YAML preview, GitHub OAuth via NextAuth, and save-to-repo via the GitHub REST API. The Hono API from `@arc-workflows/api` is mounted at `/api/v1/[[...slug]]` via `hono/vercel`.

## Validation rules

| Rule              | Severity | Catches                                                                          |
| ----------------- | -------- | -------------------------------------------------------------------------------- |
| `required-fields` | error    | Missing `on`, `jobs`, `runs-on`, `steps`; step missing `uses` or `run`           |
| `action-refs`     | error    | Invalid `uses` format (must be `owner/repo@ref`, `./local`, or `docker://image`) |
| `job-deps`        | error    | Cyclic `needs` dependencies; references to undefined jobs                        |
| `cron`            | error    | Invalid cron expressions in `schedule` triggers                                  |
| `matrix`          | error    | Empty matrix dimensions                                                          |
| `permissions`     | error    | Invalid permission scopes or values                                              |
| `expressions`     | warning  | Unknown context namespaces in `${{ }}` expressions                               |
| `runners`         | warning  | Unknown runner labels (excluding self-hosted)                                    |

## Tech stack

| Choice                                  | Why                                                                                        |
| --------------------------------------- | ------------------------------------------------------------------------------------------ |
| TypeScript strict mode                  | Type safety end-to-end, branded types for `${{ }}` expressions                             |
| pnpm workspaces                         | Fast installs, strict dependency isolation                                                 |
| Vitest                                  | Native ESM/TS, Jest-compatible API                                                         |
| Ink (CLI)                               | Battle-tested React-for-CLIs                                                               |
| XState v5 (CLI)                         | Wizard navigation as a typed state machine; same machine drives create + edit              |
| Hono (API)                              | Modern, lightweight, runs on Node, Bun, Workers, Vercel                                    |
| Next.js 15 + React Flow + Monaco (web)  | App Router, server components for templates, client islands for the DAG editor and preview |
| eemeli/yaml                             | Full YAML 1.2 spec, fine-grained control over expressions and literal blocks               |
| commander v12 (CLI)                     | Native ESM subcommand router                                                               |
| semantic-release + Conventional Commits | Automated versioning, changelog, releases                                                  |

## Releases

`semantic-release` runs on every push to `main` via `.github/workflows/release.yml`. It analyzes commit messages, picks the next version, generates `CHANGELOG.md`, creates a GitHub release, and (eventually) publishes to npm. Only `feat:` (minor) and `fix:` (patch) bumps the version.

Branch protection on `main` requires the `Merge Gate` check to pass before merging.

## Project tracking

Work was tracked in [Linear](https://linear.app/arcnology/project/workflows-fd208750f383/overview) using `W-XXXXXX` story IDs. All issues are in the `Done` state.
