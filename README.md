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
cp .env.example .env.local
pnpm install
pnpm dev
```

## Included

- Better Auth endpoint: `/api/auth/[...all]`
- Better Auth client: `/src/lib/auth-client.ts`
- DynamoDB single table utilities: `/src/lib/dynamodb.ts`

## DynamoDB Single Table Example

Use PK/SK patterns like below to manage auth and domain entities in one table:

- `USER#{id}` + `PROFILE`
- `PROJECT#{id}` + `META`
- `USER#{id}` + `PROJECT#{id}`
