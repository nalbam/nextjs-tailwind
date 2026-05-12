# Operations Runbook

Common operational scenarios. Each section is self-contained — you should be able to run from cold without reading the rest of the doc.

## Spin up local development from a clean clone

Default mode: real AWS DynamoDB + local Valkey for KV. Make sure your AWS credentials are configured (`aws configure`, `aws sso login`, or `AWS_PROFILE`).

```bash
nvm use            # Node 22 (per .nvmrc)
corepack enable    # picks pnpm 11.0.6 from packageManager pin
pnpm install
cp .env.example .env.local
# Fill BETTER_AUTH_SECRET (openssl rand -base64 32)
# Adjust AWS_REGION / DYNAMODB_TABLE_NAME as needed
docker compose up -d           # Valkey only (KV for Better Auth secondaryStorage)
pnpm db:init                   # creates the table on real AWS
pnpm dev
```

Sanity check:
- <http://localhost:3000> renders the landing page
- <http://localhost:3000/api/health> → 200 OK
- The DynamoDB table is visible in the AWS console under the configured region
- `docker exec starter-valkey valkey-cli ping` → `PONG`

### Offline / integration-test mode

Use DynamoDB Local instead of real AWS:

```bash
docker compose --profile test up -d   # adds dynamodb-local + admin UI
# Set DYNAMODB_ENDPOINT="http://localhost:8000" in .env.local
pnpm db:init
pnpm dev
```

The admin UI is at <http://localhost:8001>. CI uses the same DynamoDB Local container.

## Provision a fresh production DynamoDB table

The `pnpm db:init` script is idempotent and works against any endpoint:

```bash
unset DYNAMODB_ENDPOINT          # use the real AWS endpoint
export AWS_REGION=ap-northeast-2
export DYNAMODB_TABLE_NAME=app-main
# Standard AWS credential chain must be set (env, profile, or role).
pnpm db:init
```

Verify:

```bash
aws dynamodb describe-table --table-name app-main \
  --query 'Table.{Status:TableStatus, GSI:GlobalSecondaryIndexes[0].IndexName, TTL:`see-below`}'
aws dynamodb describe-time-to-live --table-name app-main
```

## Force-expire all sessions (security incident)

When `secondaryStorage` is configured (the starter default), Better Auth stores sessions in Valkey/Upstash and **does not** write `SESSION#*` rows to DynamoDB. Flush the KV to invalidate every active session:

```bash
# Local (Valkey)
docker exec starter-valkey valkey-cli FLUSHDB

# Upstash REST
curl -X POST "$UPSTASH_REDIS_REST_URL/flushdb" \
  -H "Authorization: Bearer $UPSTASH_REDIS_REST_TOKEN"
```

If you've enabled `session.storeSessionInDatabase: true` (or removed `secondaryStorage`), Better Auth falls back to writing `SESSION#*` rows to DynamoDB. In that mode, also clear them:

```bash
# Scan + delete (dev only — in production, prefer per-user revoke).
node -e '
const { DynamoDBClient, ScanCommand, DeleteItemCommand } = require("@aws-sdk/client-dynamodb");
const c = new DynamoDBClient({ region: process.env.AWS_REGION });
(async () => {
  let lek;
  do {
    const r = await c.send(new ScanCommand({ TableName: process.env.DYNAMODB_TABLE_NAME,
      FilterExpression: "begins_with(PK, :p) AND SK = :m",
      ExpressionAttributeValues: { ":p": {S:"SESSION#"}, ":m": {S:"META"} },
      ExclusiveStartKey: lek }));
    for (const item of r.Items ?? []) {
      await c.send(new DeleteItemCommand({
        TableName: process.env.DYNAMODB_TABLE_NAME,
        Key: { PK: item.PK, SK: item.SK }
      }));
    }
    lek = r.LastEvaluatedKey;
  } while (lek);
  console.log("done");
})();
'
```

Then **rotate `BETTER_AUTH_SECRET`** so old cookies are invalidated even if cached client-side, and redeploy.

## Rotate `BETTER_AUTH_SECRET`

1. Generate a new secret: `openssl rand -base64 32`
2. Update Amplify Hosting → *App settings → Environment variables*
3. Trigger a rebuild (push or "Redeploy this version")
4. After redeploy, all existing sessions become invalid; users must sign in again.

## Promote a user to admin (when admin plugin is enabled)

The starter doesn't enable the admin plugin by default. To wire it up:

1. Add `admin()` to `betterAuth({ plugins: [...] })` in `src/lib/auth.ts`.
2. Either pass `adminUserIds: ["<uuid>"]` in the plugin config, or set `role = "admin"` on the user row directly:

```bash
aws dynamodb update-item --table-name app-main \
  --key '{"PK": {"S":"USER#<id>"}, "SK": {"S":"META"}}' \
  --update-expression "SET #r = :r" \
  --expression-attribute-names '{"#r":"role"}' \
  --expression-attribute-values '{":r":{"S":"admin"}}'
```

## Re-create the local DB from scratch

```bash
docker compose down -v   # nukes volumes
docker compose up -d
pnpm db:init
```

## Emergency: Amplify build is failing

Most common causes (in order):

1. **`BETTER_AUTH_SECRET` not set** → `getServerEnv()` throws on first SSR request, but the *build* succeeds because of lazy init. If you also see build-time failure, check the static page list — `(protected)/dashboard` runs `force-dynamic` so it shouldn't render at build.
2. **`pnpm-lock.yaml` out of sync** → CI uses `--frozen-lockfile`. Locally re-run `pnpm install` and commit the lockfile change.
3. **Pretendard postinstall missed** → `scripts/copy-fonts.mjs` is meant to be a postinstall hook. Verify `pnpm install` ran without `--ignore-scripts`.
4. **DynamoDB IAM access denied** → IAM policy on the SSR compute role missing `arn:.../table/app-main/index/*`.

## Backups

DynamoDB on-demand backups are not enabled by default in the starter. For production:

```bash
aws dynamodb update-continuous-backups \
  --table-name app-main \
  --point-in-time-recovery-specification PointInTimeRecoveryEnabled=true
```

This enables PITR (35-day rolling window). For longer retention, schedule on-demand backups via EventBridge.
