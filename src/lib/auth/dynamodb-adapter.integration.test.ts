/**
 * Integration tests for the DynamoDB single-table adapter.
 * Requires DynamoDB Local running at $DYNAMODB_ENDPOINT (or http://localhost:8000)
 * with the application table created (`pnpm db:init`).
 *
 * Skipped automatically if the endpoint is unreachable so `pnpm test` is safe
 * to run without docker-compose.
 */

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { dynamodbAdapter } from "@/lib/auth/dynamodb-adapter";
import { getDynamoClient, getTableName } from "@/lib/dynamodb";
import { DescribeTableCommand } from "@aws-sdk/client-dynamodb";

const SUITE_TAG = `it${Date.now().toString(36)}`;

const isReachable = async (): Promise<boolean> => {
  try {
    await getDynamoClient().send(new DescribeTableCommand({ TableName: getTableName() }));
    return true;
  } catch (error) {
    console.warn(
      `[dynamodb-adapter.integration] Skipping: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
    return false;
  }
};

let available = false;

beforeAll(async () => {
  available = await isReachable();
});

afterAll(() => {
  // Items use SUITE_TAG-prefixed ids so they don't collide; adapter delete
  // will clear them via the per-test cleanup paths.
});

describe.runIf(true)("dynamodb-adapter integration", () => {
  const adapter = dynamodbAdapter({
    appName: "test",
  } as never);

  const userId = `${SUITE_TAG}_user_a`;
  const sessionId = `${SUITE_TAG}_sess_a`;
  const accountId = `${SUITE_TAG}_acct_a`;

  it("creates and retrieves a user by email and id", async () => {
    if (!available) return;
    const data = {
      id: userId,
      email: "user-a@example.com",
      emailVerified: false,
      name: "User A",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const created = await adapter.create({ model: "user", data });
    expect((created as { id: string }).id).toBe(userId);

    const byEmail = await adapter.findOne({
      model: "user",
      where: [
        {
          field: "email",
          value: "user-a@example.com",
          operator: "eq",
          connector: "AND",
          mode: "sensitive",
        },
      ],
    });
    expect(byEmail).not.toBeNull();
    expect((byEmail as { id: string }).id).toBe(userId);

    const byId = await adapter.findOne({
      model: "user",
      where: [{ field: "id", value: userId, operator: "eq", connector: "AND", mode: "sensitive" }],
    });
    expect(byId).not.toBeNull();
    expect((byId as { email: string }).email).toBe("user-a@example.com");
  });

  it("updates and deletes a user", async () => {
    if (!available) return;
    const updated = await adapter.update({
      model: "user",
      where: [{ field: "id", value: userId, operator: "eq", connector: "AND", mode: "sensitive" }],
      update: { name: "User A renamed" },
    });
    expect((updated as { name: string }).name).toBe("User A renamed");

    await adapter.delete({
      model: "user",
      where: [{ field: "id", value: userId, operator: "eq", connector: "AND", mode: "sensitive" }],
    });

    const after = await adapter.findOne({
      model: "user",
      where: [{ field: "id", value: userId, operator: "eq", connector: "AND", mode: "sensitive" }],
    });
    expect(after).toBeNull();
  });

  it("creates a session and finds it by token", async () => {
    if (!available) return;
    const expires = new Date(Date.now() + 3600_000);
    await adapter.create({
      model: "session",
      data: {
        id: sessionId,
        userId: "user-x",
        token: `${SUITE_TAG}_token`,
        expiresAt: expires,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
    const byToken = await adapter.findOne({
      model: "session",
      where: [
        {
          field: "token",
          value: `${SUITE_TAG}_token`,
          operator: "eq",
          connector: "AND",
          mode: "sensitive",
        },
      ],
    });
    expect(byToken).not.toBeNull();
    expect((byToken as { id: string }).id).toBe(sessionId);

    await adapter.delete({
      model: "session",
      where: [
        { field: "id", value: sessionId, operator: "eq", connector: "AND", mode: "sensitive" },
      ],
    });
  });

  it("creates an account and finds it by providerId+accountId", async () => {
    if (!available) return;
    await adapter.create({
      model: "account",
      data: {
        id: accountId,
        userId: "user-x",
        providerId: "credential",
        accountId: `${SUITE_TAG}_acct_remote`,
        password: "hash",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
    const found = await adapter.findOne({
      model: "account",
      where: [
        {
          field: "providerId",
          value: "credential",
          operator: "eq",
          connector: "AND",
          mode: "sensitive",
        },
        {
          field: "accountId",
          value: `${SUITE_TAG}_acct_remote`,
          operator: "eq",
          connector: "AND",
          mode: "sensitive",
        },
      ],
    });
    expect(found).not.toBeNull();
    expect((found as { id: string }).id).toBe(accountId);

    await adapter.delete({
      model: "account",
      where: [
        { field: "id", value: accountId, operator: "eq", connector: "AND", mode: "sensitive" },
      ],
    });
  });
});
