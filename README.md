# Next.js Tailwind Starter Template

A pnpm-based starter template with Node.js 22, Next.js 16, Better Auth, React 19, TypeScript, AWS DynamoDB (single table design), and Tailwind CSS.

## Stack

- Node.js 22+
- pnpm 9+
- Next.js 16
- React 19
- TypeScript
- Better Auth
- AWS DynamoDB (Single Table Design)
- Tailwind CSS

## Quick Start

```bash
pnpm install
cp .env.example .env.local
# Set BETTER_AUTH_SECRET in .env.local (e.g., openssl rand -base64 32)
pnpm dev
```

## Environment

`BETTER_AUTH_SECRET` is required — without it, the auth handler throws on the first request. Optional overrides: `BETTER_AUTH_URL`, `NEXT_PUBLIC_APP_NAME`, `AWS_REGION` (default `ap-northeast-2`), `DYNAMODB_TABLE_NAME` (default `app-main`).

## Included

- Better Auth endpoint: `/api/auth/[...all]`
- Better Auth client: `/src/lib/auth-client.ts`
- DynamoDB single table utilities: `/src/lib/dynamodb.ts`

## DynamoDB Single Table Example

Use PK/SK patterns like below to manage auth and domain entities in one table:

- `USER#{id}` + `PROFILE`
- `PROJECT#{id}` + `META`
- `USER#{id}` + `PROJECT#{id}`
