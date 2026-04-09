# @arc-workflows/web

Web app for [arc-workflows](https://github.com/andysolomon/arc-workflows) — visually build GitHub Actions workflows in the browser.

## Quick start

```bash
# from repo root
pnpm install
pnpm --filter @arc-workflows/web dev
```

Visit http://localhost:3000

## Stack

- **Next.js 15** (App Router)
- **React 19**
- **Tailwind CSS v4**
- **shadcn/ui** primitives
- **Hono** API mounted at `/api/v1/[[...slug]]` via `hono/vercel`
- **Vitest** for tests

## Environment variables

See `.env.example`. Auth-related vars are required for PR B (the editor + save flow).

## Development

```bash
pnpm --filter @arc-workflows/web dev      # next dev
pnpm --filter @arc-workflows/web build    # next build
pnpm --filter @arc-workflows/web test     # vitest run
```

## License

ISC
