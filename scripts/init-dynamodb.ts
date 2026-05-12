/**
 * Creates the application table on DynamoDB Local (or any endpoint) with PK/SK,
 * GSI1, and TTL configured. Idempotent — safe to re-run.
 *
 * Usage:
 *   pnpm db:init
 *
 * Honors AWS_REGION, DYNAMODB_TABLE_NAME, and DYNAMODB_ENDPOINT from the
 * environment (typically loaded from .env.local via next/config or shell).
 */

import {
  CreateTableCommand,
  DescribeTableCommand,
  DynamoDBClient,
  ResourceNotFoundException,
  UpdateTimeToLiveCommand,
  waitUntilTableExists,
} from "@aws-sdk/client-dynamodb";
import { config as loadEnv } from "dotenv";
import { existsSync } from "node:fs";

if (existsSync(".env.local")) {
  loadEnv({ path: ".env.local" });
} else if (existsSync(".env")) {
  loadEnv();
}

const region = process.env.AWS_REGION ?? "ap-northeast-2";
const tableName = process.env.DYNAMODB_TABLE_NAME ?? "app-main";
const endpoint = process.env.DYNAMODB_ENDPOINT;

const client = new DynamoDBClient({
  region,
  endpoint,
  credentials:
    endpoint !== undefined ? { accessKeyId: "local", secretAccessKey: "local" } : undefined,
});

const tableExists = async (): Promise<boolean> => {
  try {
    await client.send(new DescribeTableCommand({ TableName: tableName }));
    return true;
  } catch (error) {
    if (error instanceof ResourceNotFoundException) return false;
    throw error;
  }
};

const createTable = async (): Promise<void> => {
  console.log(`[init-dynamodb] Creating table ${tableName}`);
  await client.send(
    new CreateTableCommand({
      TableName: tableName,
      BillingMode: "PAY_PER_REQUEST",
      AttributeDefinitions: [
        { AttributeName: "PK", AttributeType: "S" },
        { AttributeName: "SK", AttributeType: "S" },
        { AttributeName: "GSI1PK", AttributeType: "S" },
        { AttributeName: "GSI1SK", AttributeType: "S" },
      ],
      KeySchema: [
        { AttributeName: "PK", KeyType: "HASH" },
        { AttributeName: "SK", KeyType: "RANGE" },
      ],
      GlobalSecondaryIndexes: [
        {
          IndexName: "GSI1",
          KeySchema: [
            { AttributeName: "GSI1PK", KeyType: "HASH" },
            { AttributeName: "GSI1SK", KeyType: "RANGE" },
          ],
          Projection: { ProjectionType: "ALL" },
        },
      ],
    }),
  );
  console.log(`[init-dynamodb] Submitted. Waiting for ACTIVE…`);
  // Real AWS DynamoDB returns from CreateTable while the table is still in
  // CREATING state — subsequent UpdateTimeToLive calls fail with
  // ResourceNotFoundException until it transitions to ACTIVE. DynamoDB Local
  // is instant, so this only matters against real AWS.
  await waitUntilTableExists({ client, maxWaitTime: 120 }, { TableName: tableName });
  console.log(`[init-dynamodb] Active.`);
};

const enableTtl = async (): Promise<void> => {
  try {
    await client.send(
      new UpdateTimeToLiveCommand({
        TableName: tableName,
        TimeToLiveSpecification: {
          AttributeName: "ttl",
          Enabled: true,
        },
      }),
    );
    console.log(`[init-dynamodb] TTL enabled on attribute "ttl".`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes("TimeToLive is already enabled")) {
      console.log(`[init-dynamodb] TTL already enabled.`);
      return;
    }
    if (endpoint !== undefined && message.includes("UnknownOperationException")) {
      console.warn(`[init-dynamodb] DynamoDB Local doesn't support TTL — production will use it.`);
      return;
    }
    throw error;
  }
};

const main = async (): Promise<void> => {
  console.log(
    `[init-dynamodb] region=${region} endpoint=${endpoint ?? "(default)"} table=${tableName}`,
  );
  if (await tableExists()) {
    console.log(`[init-dynamodb] Table ${tableName} already exists.`);
  } else {
    await createTable();
  }
  await enableTtl();
  console.log(`[init-dynamodb] Done.`);
};

main().catch((error) => {
  console.error(`[init-dynamodb] Failed:`, error);
  process.exitCode = 1;
});
