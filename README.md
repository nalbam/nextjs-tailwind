# Next.js Tailwind Starter Template

Node.js 22, Next.js 16, Better Auth, React 19, TypeScript, AWS DynamoDB(Single Table Design), Tailwind CSS, pnpm 기반 템플릿입니다.

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

아래 형태로 PK/SK를 구성해 인증/도메인 데이터를 하나의 테이블에서 관리할 수 있습니다.

- `USER#{id}` + `PROFILE`
- `PROJECT#{id}` + `META`
- `USER#{id}` + `PROJECT#{id}`
