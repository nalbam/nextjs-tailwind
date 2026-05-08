# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

Package manager is **pnpm** (Node.js 22+, pnpm 9+). There is no test framework configured.

```bash
pnpm install        # install deps
pnpm dev            # start Next.js dev server (http://localhost:3000)
pnpm build          # production build
pnpm start          # run production server (after build)
pnpm lint           # ESLint via flat config (eslint.config.mjs)
```

Local setup is `cp .env.example .env.local` before `pnpm dev`. `BETTER_AUTH_SECRET` (or legacy `AUTH_SECRET`) must be filled in — without it, `getAuth()` throws on the first request. `.gitignore` ignores `.env*` but allowlists `.env.example` so the template stays tracked.

## Stack & Conventions

- **Next.js 16 App Router** under `src/app/` with React 19 and TypeScript `strict: true`.
- **Path alias**: `@/*` → `./src/*` (use this instead of relative imports across `src/`).
- **Tailwind v4** via the `@tailwindcss/postcss` plugin (`postcss.config.mjs`). There is no `tailwind.config.*` — theme tokens live in `src/app/globals.css` under `@theme inline`. Do not introduce a separate JS config.
- **ESLint** uses the flat-config format extending `eslint-config-next/core-web-vitals` and `eslint-config-next/typescript`. The default ignore list (`.next/**`, `out/**`, `build/**`, `next-env.d.ts`) is re-applied explicitly because this config overrides defaults.

## Architecture

### Auth (`src/lib/auth.ts`, `src/lib/auth-client.ts`, `src/app/api/auth/[...all]/route.ts`)

- `getAuth()` is a lazy singleton wrapping `betterAuth(...)`. It is only invoked from the request handler so that builds without secrets configured do not fail at import time. Preserve this lazy-init pattern when extending auth.
- The catch-all route at `src/app/api/auth/[...all]/route.ts` delegates every HTTP verb (`GET/POST/PUT/PATCH/DELETE`) to the same handler — add new verbs here if Better Auth adopts them.
- `auth-client.ts` is `"use client"` and resolves `baseURL` from `NEXT_PUBLIC_BETTER_AUTH_URL` → `window.location.origin` → localhost fallback. Keep this file client-only; do not import it from server components.
- Required env: `BETTER_AUTH_SECRET` (or legacy `AUTH_SECRET`). Optional: `BETTER_AUTH_URL`, `NEXT_PUBLIC_BETTER_AUTH_URL`, `NEXT_PUBLIC_APP_NAME`. `emailAndPassword` is the only enabled auth method out of the box.

### DynamoDB single-table (`src/lib/dynamodb.ts`)

- One table for all entities. PK/SK patterns currently modeled:
  - `USER#{id}` / `PROFILE` — user profile
  - `PROJECT#{id}` / `META` — project metadata
  - `USER#{id}` / `PROJECT#{id}` — user↔project membership
- Always build keys via the `keys` helper, never hand-roll `PK`/`SK` strings — `keys.*` runs `validateId` (max 256 chars, regex `^[a-zA-Z0-9_-]+$`) which is the only input sanitization layer for DynamoDB ids. Bypassing it allows partition-key injection.
- Use the exported `dynamoDocumentClient` (with `removeUndefinedValues: true`) for reads/writes, not the raw `dynamoClient`.
- `SingleTableItem` is the discriminated-union contract for items. When adding a new entity: add a `keys.<entity>` factory, extend the union with `entity: "<NAME>"`, and reuse `validateId` for any id parts.
- Env: `AWS_REGION` (default `ap-northeast-2`), `DYNAMODB_TABLE_NAME` (default `app-main`). Credentials come from the standard AWS credential chain.

### UI

- `src/app/layout.tsx` sets the global dark theme (`bg-slate-950 text-slate-100`) and `lang="en"`. `src/app/page.tsx` is a server component landing page with no interactivity.
- Tailwind v4 utilities are the default styling mechanism; custom CSS belongs in `globals.css` using `@theme` tokens rather than ad-hoc selectors.
