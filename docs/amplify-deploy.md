# Amplify Deployment Guide

This template is built to run on **AWS Amplify Hosting** with SSR (Lambda compute). The Better Auth + DynamoDB + Upstash combination keeps every request VPC-free, so cold starts stay short and there is no NAT Gateway cost.

## 1. Prerequisites

- Amplify Hosting app connected to this repository
- A DynamoDB table provisioned in your AWS account (production replacement for `app-main`). See [`docs/dynamodb-schema.md`](./dynamodb-schema.md) for the schema.
- Upstash Redis database (REST URL + token) for `secondaryStorage` (sessions / rate limit). [https://upstash.com](https://upstash.com)

## 2. IAM policy for the SSR compute role

In the Amplify console, go to *App settings → IAM roles → SSR Compute role* and attach a policy that grants DynamoDB access to the table and its GSI:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "DynamoDBSingleTable",
      "Effect": "Allow",
      "Action": [
        "dynamodb:GetItem",
        "dynamodb:PutItem",
        "dynamodb:UpdateItem",
        "dynamodb:DeleteItem",
        "dynamodb:Query",
        "dynamodb:Scan",
        "dynamodb:BatchGetItem",
        "dynamodb:BatchWriteItem",
        "dynamodb:DescribeTable",
        "dynamodb:TransactWriteItems",
        "dynamodb:TransactGetItems"
      ],
      "Resource": [
        "arn:aws:dynamodb:ap-northeast-2:<ACCOUNT_ID>:table/app-main",
        "arn:aws:dynamodb:ap-northeast-2:<ACCOUNT_ID>:table/app-main/index/*"
      ]
    }
  ]
}
```

Replace `<ACCOUNT_ID>` and the region/table name with your values.

> Do **not** ship `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` as Amplify environment variables in production. The compute role's IAM credentials are picked up automatically by the AWS SDK's default credential chain.

## 3. Environment variables

Set these in Amplify Hosting → *App settings → Environment variables*:

| Variable | Required | Notes |
|---|---|---|
| `BETTER_AUTH_SECRET` | yes | `openssl rand -base64 32` |
| `BETTER_AUTH_URL` | yes | e.g. `https://app.example.com` |
| `TRUSTED_ORIGINS` | optional | Comma-separated additional origins |
| `NEXT_PUBLIC_BETTER_AUTH_URL` | yes | Same as above (client-side) |
| `NEXT_PUBLIC_APP_NAME` | optional | Defaults to `Next.js Tailwind Starter` |
| `AWS_REGION` | yes | Region of your DynamoDB table |
| `DYNAMODB_TABLE_NAME` | yes | e.g. `app-main` |
| `UPSTASH_REDIS_REST_URL` | yes (prod) | From Upstash console |
| `UPSTASH_REDIS_REST_TOKEN` | yes (prod) | From Upstash console |
| `DYNAMODB_ENDPOINT` | **no** | Leave empty in prod. Only used to point at DynamoDB Local. |
| `REDIS_URL` | **no** | Leave empty in prod (use Upstash). |
| `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` | **no** | Use the compute role instead. |

The repo's [`amplify.yml`](../amplify.yml) handles install + build; no further build configuration is required.

## 4. Provision DynamoDB

Use the schema in [`docs/dynamodb-schema.md`](./dynamodb-schema.md). Minimum:

- Partition key `PK` (S), Sort key `SK` (S)
- GSI `GSI1`: partition `GSI1PK` (S), sort `GSI1SK` (S), projection `ALL`
- TTL attribute: `ttl`
- Billing mode: PAY_PER_REQUEST (recommended for unpredictable starter traffic)

## 5. Connect & deploy

1. Push to your default branch.
2. Amplify auto-builds via `amplify.yml`.
3. After the first deploy, hit `https://<your-domain>/api/health` to confirm the SSR Lambda is up.
4. Create a test account via `/signup`, then verify a `USER#…` row exists in DynamoDB and a `better-auth.session_token` cookie was issued.

## 6. Rolling out additional regions

If you serve users globally, deploy a Read Replica via DynamoDB Global Tables and add an `AWS_REGION` override per Amplify branch. Better Auth and the adapter are stateless — every region's SSR Lambda will read/write to the local replica.

## 7. Troubleshooting

- **`getServerEnv()` throws on first request** — `BETTER_AUTH_SECRET` not set.
- **`AccessDeniedException` on DynamoDB** — IAM policy missing the `index/*` resource for GSI1.
- **Sessions are not persisted across requests** — Upstash variables missing (Better Auth fell back to no `secondaryStorage`).
- **Cookies not set on production** — `BETTER_AUTH_URL` mismatched with the site origin or `TRUSTED_ORIGINS` not configured for additional domains.
