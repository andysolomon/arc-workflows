# arc-workflows

A delightful tool for creating GitHub Actions workflows — through an interactive CLI wizard, a programmatic API, and (soon) a visual web app.

> **Status:** Phase 0 complete (scaffold + tooling). Phase 1 (core engine) in progress.

## Why

Writing GitHub Actions YAML by hand is tedious. The spec is large, mistakes don't surface until you push, and starter templates from the marketplace get stale fast. arc-workflows is a full DX layer over GitHub Actions:

- **Guides you through the spec** with a wizard that doesn't require memorizing YAML keys
- **Catches errors before commit** with structured validation
- **Live YAML preview** updates as you make choices in the CLI
- **10 built-in templates** (CI for Node/Python, deploys, releases, Docker, cron, dispatch, reusable, monorepo)
- **Programmatic API** for building workflows in TypeScript
- **Visual editor** in the browser (coming in Phase 4)

## Architecture

This is a pnpm monorepo with three packages:

```
arc-workflows/
├── packages/
│   ├── core/    # @arc-workflows/core — schema, validation, YAML generation, templates
│   ├── cli/     # arc-workflows — Ink-based interactive wizard
│   └── api/     # @arc-workflows/api — fluent builder + Hono REST server
└── web/         # Next.js + React Flow visual builder (Phase 4)
```

| Package               | Purpose                                                                                                                                           |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@arc-workflows/core` | TypeScript types modeling the GitHub Actions spec, validation pipeline, YAML generation, and built-in templates. Zero runtime deps beyond `yaml`. |
| `arc-workflows` (CLI) | Ink (React for terminals) wizard with split-pane live YAML preview, expression autocomplete, and an action picker.                                |
| `@arc-workflows/api`  | Fluent TypeScript builder API and a Hono REST server that wraps `core`.                                                                           |

## Tech stack

| Choice                                       | Why                                                                               |
| -------------------------------------------- | --------------------------------------------------------------------------------- |
| **TypeScript** strict mode                   | Type safety end-to-end, branded types for `${{ }}` expressions                    |
| **pnpm workspaces**                          | Fast installs, strict dependency isolation                                        |
| **Vitest**                                   | Native ESM/TS, fast, Jest-compatible API                                          |
| **Ink**                                      | Battle-tested React-for-CLIs (used by Claude Code, Copilot CLI)                   |
| **Hono**                                     | Modern, lightweight, TypeScript-first API framework                               |
| **eemeli/yaml**                              | Full YAML 1.2 spec, fine-grained control over expressions and literal blocks      |
| **ESLint flat config** + `typescript-eslint` | Type-checked linting with `recommended-type-checked` and `stylistic-type-checked` |
| **Prettier**                                 | Consistent formatting                                                             |
| **semantic-release** + Conventional Commits  | Automated versioning, changelog, releases                                         |

## Quick start

### Prerequisites

- **Node.js** ≥ 22 (the project pins to LTS in CI; Node 20 works locally with warnings)
- **pnpm** 9.15.0 — managed via [Corepack](https://nodejs.org/api/corepack.html), no manual install required

### Setup

```bash
git clone https://github.com/andysolomon/arc-workflows.git
cd arc-workflows
corepack enable           # one-time, if you haven't already
pnpm install
```

### Common commands

```bash
pnpm build         # tsc -b across all packages
pnpm test          # vitest run across all packages
pnpm lint          # eslint .
pnpm lint:fix      # eslint . --fix
pnpm format        # prettier --write .
pnpm format:check  # prettier --check .
pnpm clean         # remove dist/ from each package
```

Per-package scripts work the same way:

```bash
pnpm --filter @arc-workflows/core build
pnpm --filter arc-workflows test
```

## Development workflow

### Branches & PRs

`main` is protected. All work happens on feature branches and lands via PRs.

```bash
git checkout -b feat/W-XXXXXX-short-description
# ... make changes, commit ...
git push -u origin feat/W-XXXXXX-short-description
gh pr create
```

A `pre-commit` husky hook blocks direct commits to `main` so you can't push by accident.

### Conventional Commits

Every commit must follow the [Conventional Commits](https://www.conventionalcommits.org/) spec. A `commit-msg` husky hook runs `commitlint` to enforce it.

| Prefix                                                                      | Bumps | Example                                  |
| --------------------------------------------------------------------------- | ----- | ---------------------------------------- |
| `fix:`                                                                      | PATCH | `fix: handle empty matrix dimensions`    |
| `feat:`                                                                     | MINOR | `feat(cli): add expression autocomplete` |
| `feat!:` or `BREAKING CHANGE:`                                              | MAJOR | `feat!: drop Node 18 support`            |
| `chore:`, `docs:`, `test:`, `build:`, `ci:`, `refactor:`, `perf:`, `style:` | none  | `docs: add README`                       |

Only `feat` and `fix` trigger version bumps. Everything else appears in the changelog.

### Releases

`semantic-release` runs automatically on every push to `main` via `.github/workflows/release.yml`. It analyzes commit messages, picks the next version, generates `CHANGELOG.md`, creates a GitHub release, and (eventually) publishes to npm.

### CI

Three workflows run on every PR:

- **`pr.yml`** — separate jobs for commitlint, lint, and test
- **`merge.yml`** — single `Merge Gate` status check that runs commitlint + build + lint + test (used as the required status check in branch protection)
- **`release.yml`** — runs `semantic-release` on push to `main`

## Project tracking

Work is tracked in [Linear](https://linear.app/arcnology/project/workflows-fd208750f383/overview) using `W-XXXXXX` story IDs. Each story has Gherkin acceptance criteria and an epic label (`epic:scaffold`, `epic:core-engine`, `epic:cli-wizard`, `epic:edit-mode`, `epic:api-layer`, `epic:web-app`).

The full implementation plan lives in [`PLAN.md`](./PLAN.md).

## License

ISC
