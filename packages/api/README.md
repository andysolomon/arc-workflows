# @arc-workflows/api

Fluent TypeScript builder API and a Hono REST server for [arc-workflows](https://github.com/andysolomon/arc-workflows). Wraps `@arc-workflows/core` so you can build, validate, generate, and parse workflows programmatically or over HTTP.

## Install

```bash
pnpm add @arc-workflows/api
# or
npm install @arc-workflows/api
```

## Fluent builder

Build a workflow with a chainable API that mirrors the GitHub Actions spec:

```ts
import { workflow, job, step, matrix } from '@arc-workflows/api';

const ci = workflow('CI')
  .on('pull_request', { branches: ['main'] })
  .on('push', { branches: ['main'] })
  .job(
    job('build')
      .runsOn('ubuntu-latest')
      .strategy(matrix({ 'node-version': ['18', '20', '22'] }))
      .step(step().uses('actions/checkout@v4'))
      .step(
        step().uses('actions/setup-node@v4').with({ 'node-version': '${{ matrix.node-version }}' }),
      )
      .step(step().run('npm ci'))
      .step(step().run('npm test')),
  )
  .toYAML();
```

| Builder           | Constructor       | Returns                                      |
| ----------------- | ----------------- | -------------------------------------------- |
| `WorkflowBuilder` | `workflow(name?)` | Top-level workflow with triggers + jobs      |
| `JobBuilder`      | `job(id)`         | Single job (steps, runs-on, needs, strategy) |
| `StepBuilder`     | `step()`          | Single step (uses or run)                    |
| `MatrixBuilder`   | `matrix(dims)`    | Strategy matrix with include/exclude         |

Every builder exposes `.toJSON()` (returns the raw `Workflow` / `Job` / `Step` / matrix object) so you can mix the fluent API with hand-built objects. `WorkflowBuilder.toYAML()` calls into core's `generate()`.

## REST server

A Hono app exposing 5 endpoints:

| Method | Path                      | Description                                               |
| ------ | ------------------------- | --------------------------------------------------------- |
| GET    | `/api/templates`          | List all built-in templates (id, name, description, tags) |
| GET    | `/api/templates/:id`      | Get a template by id (returns the Workflow object)        |
| POST   | `/api/workflows/validate` | Run the validation pipeline on a workflow object          |
| POST   | `/api/workflows/generate` | Generate YAML from a workflow object                      |
| POST   | `/api/workflows/parse`    | Parse a YAML string back into a workflow object           |

All POST bodies are validated with [Zod](https://zod.dev/) via `@hono/zod-validator`. Invalid bodies return `400` with the Zod error.

### Run the server

```ts
import { serve } from '@arc-workflows/api';

serve({ port: 3000 });
```

Or mount the app yourself in any Hono-compatible runtime (Node, Bun, Cloudflare Workers, Vercel):

```ts
import { app } from '@arc-workflows/api';

export default app; // works on Vercel, Workers, etc.
```

The web app at [`apps/web`](../../apps/web) mounts this exact `app` at `/api/v1/[[...slug]]` via `hono/vercel`.

### Example request

```bash
curl -X POST http://localhost:3000/api/workflows/validate \
  -H "Content-Type: application/json" \
  -d '{"workflow":{"name":"CI","on":{"push":{}},"jobs":{"build":{"runs-on":"ubuntu-latest","steps":[{"run":"npm test"}]}}}}'
```

## License

ISC
