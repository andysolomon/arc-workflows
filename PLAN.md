# arc-workflows — Development Plan

A tool for creating GitHub Actions workflows through a wizard-style CLI, a programmatic API, and eventually a web app.

## Architecture Overview

```
arc-workflows/
├── packages/
│   ├── core/          # Workflow engine — schema, validation, YAML generation
│   ├── cli/           # Interactive wizard CLI
│   └── api/           # REST/programmatic API layer
├── templates/         # Built-in workflow templates (CI, deploy, release, etc.)
├── examples/          # Example generated workflows
└── web/               # Web app (Phase 3)
```

Monorepo with shared `core` package. The CLI and API both consume `core` — no logic duplication.

---

## Phase 1 — Core Engine

**Goal:** Build the workflow data model and YAML generator. Everything else depends on this.

### 1.1 Workflow Schema

Define TypeScript types that model the full GitHub Actions workflow spec:

- `Workflow` — top-level: name, on (triggers), permissions, env, jobs
- `Trigger` — push, pull_request, schedule, workflow_dispatch, repository_dispatch, etc.
- `Job` — name, runs-on, needs (dependencies), strategy (matrix), steps, if, services, container
- `Step` — name, uses (action reference), run (shell command), with, env, if, id
- `Matrix` — dimensions, include/exclude
- `Permissions` — contents, issues, pull-requests, packages, etc.

Support the full trigger event set:
- Branch/tag filters (branches, branches-ignore, tags, tags-ignore, paths, paths-ignore)
- Cron schedule
- Manual dispatch with inputs
- Reusable workflow calls (workflow_call)

### 1.2 Validation

Validate workflows before generating YAML:

- Required fields present (name, at least one trigger, at least one job with steps)
- Action references are valid format (`owner/repo@ref` or `./local-path`)
- Job dependency graph has no cycles (`needs` references)
- Matrix dimensions are non-empty
- Cron expressions are valid
- `runs-on` is a valid runner label
- Permissions use valid scope names

Return structured errors with paths (e.g., `jobs.build.steps[2].uses: invalid action reference`).

### 1.3 YAML Generation

Convert the typed workflow object to valid GitHub Actions YAML:

- Preserve key ordering (name, on, permissions, env, jobs)
- Handle multi-line `run` blocks with `|` literal style
- Handle expressions (`${{ }}`) without quoting them
- Support anchors and references for repeated config (optional)
- Output to string or write directly to `.github/workflows/`

### 1.4 Template System

Built-in templates as starting points that the wizard can offer:

| Template | Description |
|----------|------------|
| `ci-node` | Install, lint, test on PR — Node.js |
| `ci-python` | Install, lint, test on PR — Python |
| `deploy-vercel` | Deploy to Vercel on push to main |
| `deploy-aws` | Deploy to AWS (ECR + ECS or Lambda) |
| `release-semantic` | semantic-release on push to main |
| `docker-build` | Build and push Docker image |
| `cron-task` | Scheduled job with cron |
| `manual-dispatch` | workflow_dispatch with typed inputs |
| `reusable` | Reusable workflow with workflow_call |
| `monorepo-ci` | Path-filtered CI for monorepo packages |

Templates are TypeScript objects (not YAML files) so they compose with the wizard.

### Deliverables

- `packages/core/src/schema.ts` — TypeScript types
- `packages/core/src/validate.ts` — Validation logic
- `packages/core/src/generate.ts` — YAML generator
- `packages/core/src/templates/` — Built-in templates
- `packages/core/src/index.ts` — Public API
- Full test suite for validation and generation

---

## Phase 2 — CLI Wizard

**Goal:** Interactive terminal wizard that walks users through creating a workflow step by step.

### 2.1 Wizard Flow

```
$ arc-workflows

? What would you like to do?
  ❯ Create a new workflow
    Edit an existing workflow
    List workflow templates

? Start from a template or build from scratch?
  ❯ Start from a template
    Build from scratch

? Choose a template:
  ❯ CI — Node.js (install, lint, test on PR)
    CI — Python
    Deploy to Vercel
    Docker Build & Push
    Semantic Release
    Scheduled Task
    Manual Dispatch
    Custom (blank)

? Workflow name: CI

? Which events should trigger this workflow? (select multiple)
  ❯ ◉ Pull request
    ◯ Push to branch
    ◯ Schedule (cron)
    ◯ Manual dispatch
    ◯ Release published

? Which branches for pull_request? (comma-separated)
  main

? Configure jobs:
  ❯ Add a job
    Done

? Job name: build
? Runner: ubuntu-latest
? Add steps:
  ❯ Use an action (actions/checkout, actions/setup-node, etc.)
    Run a shell command
    Done with this job

? Action: actions/checkout@v4
? Action: actions/setup-node@v4
  ? node-version: 'lts/*'
? Shell command: npm ci
? Shell command: npm run lint
? Shell command: npm test

? Add another job? (y/N)

✅ Workflow written to .github/workflows/ci.yml
```

### 2.2 Features

- **Template-first:** most users start from a template and customize
- **Step auto-complete:** suggest common actions (checkout, setup-node, setup-python, cache, etc.)
- **Matrix builder:** interactive matrix dimension builder (`? Add a matrix dimension: node-version → 18, 20, 22`)
- **Job dependencies:** `? Does this job depend on another? → select from existing jobs`
- **Secrets helper:** detect `${{ secrets.X }}` usage and remind user to set them
- **Dry run:** show the generated YAML before writing, let user edit or confirm
- **Edit mode:** load an existing `.github/workflows/*.yml`, parse it back into the schema, and re-enter the wizard
- **Validation feedback:** if the workflow has issues, show them inline before writing

### 2.3 CLI Commands

```
arc-workflows create              # Start the wizard
arc-workflows create --template ci-node  # Start from a specific template
arc-workflows edit <file>         # Edit an existing workflow
arc-workflows validate <file>     # Validate a workflow file
arc-workflows list-templates      # Show available templates
arc-workflows generate <file>     # Re-generate YAML from a workflow JSON
```

### 2.4 Tech Stack

- [inquirer](https://github.com/SBoudrias/Inquirer.js) or [prompts](https://github.com/terkelg/prompts) for interactive prompts
- [commander](https://github.com/tj/commander.js) for CLI argument parsing
- [chalk](https://github.com/chalk/chalk) for colored output
- [yaml](https://github.com/eemeli/yaml) for YAML serialization (better control than js-yaml)

### Deliverables

- `packages/cli/src/wizard.ts` — Main wizard flow
- `packages/cli/src/commands/` — create, edit, validate, list-templates, generate
- `packages/cli/src/prompts/` — Reusable prompt builders (trigger selector, step builder, matrix builder)
- `packages/cli/src/index.ts` — Entry point
- `packages/cli/bin/arc-workflows` — Executable
- Manual testing against real repos

---

## Phase 3 — API Layer

**Goal:** Programmatic API for building workflows in code — used by the future web app and by other tools.

### 3.1 Builder API

Fluent TypeScript API that wraps `core`:

```ts
import { workflow, job, step } from '@arc-workflows/api';

const ci = workflow('CI')
  .on('pull_request', { branches: ['main'] })
  .permissions({ contents: 'read' })
  .job(
    job('build')
      .runsOn('ubuntu-latest')
      .step(step().uses('actions/checkout@v4'))
      .step(step().uses('actions/setup-node@v4').with({ 'node-version': 'lts/*' }))
      .step(step().run('npm ci'))
      .step(step().run('npm test'))
  );

const yaml = ci.toYAML();
ci.writeTo('.github/workflows/ci.yml');
```

### 3.2 REST API (for web app)

Express or Hono server exposing:

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/templates` | List available templates |
| GET | `/api/templates/:id` | Get a template as a workflow object |
| POST | `/api/workflows/validate` | Validate a workflow object |
| POST | `/api/workflows/generate` | Generate YAML from a workflow object |
| POST | `/api/workflows/parse` | Parse YAML back into a workflow object |

Stateless — no database needed. The web app sends workflow objects, the API validates and returns YAML.

### Deliverables

- `packages/api/src/builder.ts` — Fluent builder API
- `packages/api/src/server.ts` — REST server
- `packages/api/src/routes/` — Route handlers
- `packages/api/src/index.ts` — Public exports
- API tests

---

## Phase 4 — Web App

**Goal:** Visual workflow builder in the browser. Plan this phase after Phases 1–3 are solid.

High-level direction (details TBD):

- **Visual editor:** drag-and-drop job/step builder, wired to the API
- **Live YAML preview:** side panel showing generated YAML updating in real-time
- **Template gallery:** browse and customize templates
- **GitHub integration:** OAuth to write workflows directly to repos
- **Share/export:** shareable links, copy YAML, download file

Tech stack candidates: Next.js, React Flow (for visual DAG), Monaco Editor (for YAML preview).

This phase will get its own detailed plan once Phases 1–3 are complete.

---

## Development Milestones

| Milestone | Phase | Definition of Done |
|-----------|-------|--------------------|
| **M1: Core engine** | 1 | Schema types, validation, YAML generation, 10 templates, full test coverage |
| **M2: CLI wizard** | 2 | Interactive workflow creation from templates and scratch, edit mode, validate command |
| **M3: Builder API** | 3 | Fluent TS API, REST endpoints, parse + generate round-trip |
| **M4: Web app** | 4 | Visual editor with live preview, template gallery, GitHub OAuth |

## Conventions

- Monorepo managed with npm workspaces
- TypeScript strict mode
- Conventional commits (enforced by arc-conventional-commits skill)
- Feature branches + PRs to main
- Each phase gets its own set of feature branches
