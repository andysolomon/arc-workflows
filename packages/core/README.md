# @arc-workflows/core

The core engine for [arc-workflows](https://github.com/andysolomon/arc-workflows) — TypeScript types, validation, YAML generation, and built-in templates for GitHub Actions workflows.

## Install

```bash
pnpm add @arc-workflows/core
# or
npm install @arc-workflows/core
```

## Quick start

### Create a workflow from scratch

```ts
import { generate, type Workflow } from '@arc-workflows/core';

const ci: Workflow = {
  name: 'CI',
  on: { pull_request: { branches: ['main'] } },
  jobs: {
    build: {
      'runs-on': 'ubuntu-latest',
      steps: [
        { uses: 'actions/checkout@v4' },
        { uses: 'actions/setup-node@v4', with: { 'node-version': '20' } },
        { run: 'npm ci' },
        { run: 'npm test' },
      ],
    },
  },
};

console.log(generate(ci));
```

### Use a built-in template

```ts
import { getTemplate, writeWorkflow } from '@arc-workflows/core';

const ci = getTemplate('ci-node', { nodeVersion: '20', packageManager: 'pnpm' });
await writeWorkflow(ci, '.github/workflows/ci.yml');
```

### Validate a workflow

```ts
import { validate, type Workflow } from '@arc-workflows/core';

const result = validate(workflow);
if (!result.valid) {
  for (const err of result.errors) {
    console.error(`${err.path.join('.')}: ${err.message}`);
  }
}
```

## API reference

| Export                            | Type     | Purpose                                     |
| --------------------------------- | -------- | ------------------------------------------- |
| `Workflow`                        | type     | The full GitHub Actions workflow shape      |
| `Job`, `NormalJob`, `ReusableJob` | type     | Job variants                                |
| `Step`, `ActionStep`, `RunStep`   | type     | Step variants (discriminated union)         |
| `generate(workflow, options?)`    | function | Generate YAML string                        |
| `writeWorkflow(workflow, path?)`  | function | Generate and write to disk                  |
| `validate(workflow)`              | function | Run validation pipeline                     |
| `getTemplate(id, params?)`        | function | Get a built-in template                     |
| `listTemplates()`                 | function | List all template metadata                  |
| `expr<T>(template)`               | function | Tag a string as a GitHub Actions expression |
| `isExpressionString(value)`       | function | Detect a `${{ }}` expression                |

See the [TypeScript types](./dist/index.d.ts) for full details.

## Built-in templates

| ID                 | Description                                  |
| ------------------ | -------------------------------------------- |
| `ci-node`          | Node.js CI: install, lint, test on PR        |
| `ci-python`        | Python CI: install, pytest on PR             |
| `deploy-vercel`    | Deploy to Vercel on push to main             |
| `deploy-aws`       | Deploy to AWS (ECR + ECS) on push to main    |
| `release-semantic` | semantic-release on push to main             |
| `docker-build`     | Build and push Docker image on push and tags |
| `cron-task`        | Scheduled job with cron trigger              |
| `manual-dispatch`  | workflow_dispatch with typed inputs          |
| `reusable`         | Reusable workflow with workflow_call         |
| `monorepo-ci`      | Path-filtered CI for monorepo packages       |

## Validation rules

The validator runs 8 rules and collects all errors and warnings:

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

## License

ISC
