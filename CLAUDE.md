# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

Package manager: **pnpm** (Node.js 22+, pnpm 11+ — `engines` and `packageManager` are pinned).

```bash
pnpm install
pnpm dev                # http://localhost:3000
pnpm build
pnpm start
pnpm lint               # ESLint flat config
pnpm typecheck          # tsc --noEmit
pnpm format             # Prettier write
pnpm test               # Vitest run
pnpm test:watch
pnpm db:init            # create DynamoDB table + GSI1 + TTL
docker compose up -d    # DynamoDB Local + Valkey + DynamoDB admin
```

`.env.local` must be populated before `pnpm dev`. `BETTER_AUTH_SECRET` (≥ 32 chars) is required — `getServerEnv()` throws fast if missing.

## Stack & conventions

- **Next.js 16 App Router** under `src/app/` with React 19 and TypeScript `strict + noUncheckedIndexedAccess + noImplicitOverride`.
- **Path alias**: `@/*` → `./src/*`.
- **Tailwind v4** via `@tailwindcss/postcss`. Tokens live in `src/app/globals.css` under `@theme inline`. There is no `tailwind.config.*`.
- **shadcn/ui** (`new-york`, base color `slate`). Primitives in `src/components/ui/`. Re-exported via the `radix-ui` aggregate package, never the per-component `@radix-ui/react-*` packages.
- **Pretendard** font is copied from `node_modules/pretendard` into `src/app/fonts/` by `scripts/copy-fonts.mjs` (postinstall) and loaded with `next/font/local`. Don't commit the woff2 — `.gitignore` excludes it.
- **ESLint** uses the flat-config format extending `eslint-config-next/core-web-vitals` and `eslint-config-next/typescript`. The default ignore list is re-applied explicitly.

## Architecture

### Auth (`src/lib/auth.ts`, `src/lib/auth/*`, `src/app/api/auth/[...all]/route.ts`)

- `getAuth()` is a lazy singleton — `betterAuth(...)` is constructed on first call so `pnpm build` succeeds without secrets at import time. Preserve this pattern when extending auth.
- `database: dynamodbAdapter` — the adapter factory in `src/lib/auth/dynamodb-adapter.ts`. Better Auth invokes it with its own options.
- `secondaryStorage: secondaryStorage` (when `REDIS_URL` or `UPSTASH_REDIS_REST_URL` is set). The KV facade is sync; the underlying client is resolved lazily on first `get/set/delete`.
- `plugins: [nextCookies()]` so server actions get correct `Set-Cookie` semantics.
- The `[...all]` route uses `toNextJsHandler((req) => getAuth().handler(req))` — keep the wrapper so `getAuth()` stays lazy.
- `auth-client.ts` is `"use client"` and resolves `baseURL` from `clientEnv.NEXT_PUBLIC_BETTER_AUTH_URL` → `window.location.origin` → localhost fallback. Do not import it from server components.
- Server-side session: `getSession()` in `src/lib/auth/session.ts` calls `auth.api.getSession({ headers })`.
- `src/proxy.ts` (Next 16's renamed `middleware`) only does a cookie presence check (cheap, no DDB hit). Real validation happens in `app/(protected)/layout.tsx`.

### env (`src/lib/env.ts`)

- `clientEnv` — parsed eagerly at import (NEXT_PUBLIC_* only).
- `getServerEnv()` — lazy, server-side only, cached. Throws with a multi-line summary listing every invalid variable.
- Add new env vars to *both* the zod schema and `.env.example`.

### DynamoDB single-table (`src/lib/dynamodb.ts`, `src/lib/dynamodb-helpers.ts`)

- One table for both auth and domain entities. PK/SK + GSI1 + TTL. Schema details: [`docs/dynamodb-schema.md`](./docs/dynamodb-schema.md).
- Existing PK/SK patterns:
  - `USER#{id}` / `PROFILE` — domain user profile
  - `PROJECT#{id}` / `META` — project metadata
  - `USER#{id}` / `PROJECT#{id}` — user↔project membership
- Auth adapter rows live on `USER#{id}/META`, `SESSION#{id}/META`, `ACCOUNT#{id}/META`, `VERIFICATION#{id}/META` — different SK from the domain rows so they never collide.
- Always build keys via `keys.*` and `gsi1.*`. Never hand-roll `PK`/`SK` strings — `validateId` (max 256 chars, regex `^[a-zA-Z0-9_-]+$`) and `sanitizeKeyValue` are the only input sanitization layer for partition-key strings.
- Use `getDocumentClient()` (with `removeUndefinedValues: true`) for reads/writes. `getDynamoClient()` is the underlying SDK client.
- `dynamodb-helpers.ts` exposes `getItem/putItem/deleteItem/queryByPK/queryGSI1/scanAll/transactWrite/updateItem` thin wrappers — prefer these over raw commands.
- `ttlFromDate(date)` returns epoch seconds for the `ttl` attribute on session / verification rows.

### Better Auth DynamoDB adapter (`src/lib/auth/dynamodb-adapter.ts`)

- Uses `createAdapterFactory({ config, adapter })` from `better-auth/adapters`.
- `supportsDates: false` so Better Auth converts `Date` ↔ ISO string before items hit DynamoDB.
- `transaction: false` — Better Auth falls back to sequential ops; sufficient for the starter and avoids the DDB 25/100-item TransactWrite limit.
- Where routing: `id eq` only → `GetItem`; known indexed field eq → `Query GSI1` + in-memory filter; otherwise → `Scan` filtered by entity prefix.
- Updates use `PutItem` (full row replacement) so GSI1 keys stay consistent when indexed fields change.
- Adding new auth plugins / models: extend `ENTITY_PREFIX`, `buildGSI1Key`, `tryGSI1Lookup`, and `buildTtl`. Don't add `Scan` calls in hot paths.

### UI

- `src/app/layout.tsx` mounts the global `<Toaster />` and applies `pretendard.variable`. Body styling lives in `globals.css` (tokens + radial gradient). Don't add raw color utilities to `<body>`.
- shadcn primitives use design tokens (`bg-card`, `text-foreground`, etc.). Avoid raw `slate-*` classes when a token exists.
- Auth pages live under `app/(auth)/` — they use the client `authClient.signIn.email` / `signUp.email` and react with `sonner` toasts.
- Protected pages live under `app/(protected)/` — the layout calls `getSession()` and `redirect('/login')` on miss. The `proxy.ts` cookie check is a hint, not authoritative.

## Testing

- Unit tests live next to source files (`*.test.ts`).
- Integration tests use the `*.integration.test.ts` suffix and run against DynamoDB Local. They `runIf(true)` but each test calls `if (!available) return;` so missing DDB Local just no-ops the assertions.
- `vitest.setup.ts` provides safe defaults for env vars; tests should not depend on `.env.local`.

## Deployment

Target: **AWS Amplify Hosting (SSR)**. Full guide in [`docs/amplify-deploy.md`](./docs/amplify-deploy.md). Key constraints:

- IAM role on the SSR compute role (no static AWS keys in env).
- Upstash Redis REST for `secondaryStorage` (no VPC).
- `BETTER_AUTH_URL` + `TRUSTED_ORIGINS` must match the deployed origin.

## Common gotchas

- `pnpm install` may prompt to re-create `node_modules` after `package.json` changes — this is normal pnpm behavior.
- `pnpm-workspace.yaml` exists with `packages: []` so pnpm 9 stops complaining about missing packages while still honoring `allowBuilds`.
- `next/font/local` requires the woff2 to be a literal path — it cannot reach into `node_modules`. The postinstall copy script is intentional, do not refactor it into a build-time copy.
- DynamoDB Local doesn't support TTL — `pnpm db:init` swallows the `UnknownOperationException` and warns. Production DynamoDB does support it.
