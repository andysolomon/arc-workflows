# @arc-workflows/web

The browser-based workflow editor for [arc-workflows](https://github.com/andysolomon/arc-workflows). Pick a template from the gallery, edit jobs visually as a DAG, watch the YAML preview update live, and save back to a GitHub repo.

## Features

- **Template gallery** at `/` — browse and launch from the 10 built-in templates
- **Visual editor** at `/editor/[id]` — React Flow DAG of jobs with `needs` edges
- **Step configurator** — sidebar form for `uses`, `with`, `run`, `env`, `if`, etc.
- **Live YAML preview** — Monaco editor running `@arc-workflows/core`'s `generate()` on every reducer dispatch
- **Save to repo** — GitHub OAuth (NextAuth) + the GitHub REST API to commit the YAML to `.github/workflows/`
- **Embedded Hono API** at `/api/v1/[[...slug]]` — same endpoints as `@arc-workflows/api`, mounted via `hono/vercel`

## Stack

- **Next.js 15** (App Router, React 19)
- **Tailwind CSS v4** + **shadcn/ui** primitives
- **React Flow** for the job DAG
- **Monaco Editor** for YAML preview (read-only)
- **NextAuth** with GitHub provider
- **Hono** API mounted via `hono/vercel`
- **Vitest** for unit tests; **Playwright** for E2E (configured)

## Quick start

```bash
# from repo root
pnpm install
pnpm --filter @arc-workflows/web dev
```

Visit http://localhost:3000.

## Environment variables

Copy `.env.example` to `.env.local` and fill in the GitHub OAuth credentials (only required for the save-to-repo flow; everything else works without auth).

## Scripts

```bash
pnpm --filter @arc-workflows/web dev      # next dev
pnpm --filter @arc-workflows/web build    # next build
pnpm --filter @arc-workflows/web start    # next start (production)
pnpm --filter @arc-workflows/web test     # vitest run
pnpm --filter @arc-workflows/web lint     # next lint
```

## License

ISC
