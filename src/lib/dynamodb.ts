import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

const region = process.env.AWS_REGION ?? "ap-northeast-2";

export const tableName = process.env.DYNAMODB_TABLE_NAME ?? "app-main";

const validateId = (id: string) => {
  if (id.length > 256) {
    throw new Error("Invalid id length. Maximum length is 256 characters.");
  }

  if (!/^[a-zA-Z0-9_-]+$/.test(id)) {
    throw new Error(
      "Invalid id format. Only letters, numbers, underscores, and hyphens are allowed.",
    );
  }

  return id;
};

export const dynamoClient = new DynamoDBClient({
  region,
});

export const dynamoDocumentClient = DynamoDBDocumentClient.from(dynamoClient, {
  marshallOptions: {
    removeUndefinedValues: true,
  },
});

export const keys = {
  user: (userId: string) => ({
    PK: `USER#${validateId(userId)}`,
    SK: "PROFILE",
  }),
  project: (projectId: string) => ({
    PK: `PROJECT#${validateId(projectId)}`,
    SK: "META",
  }),
  userProject: (userId: string, projectId: string) => ({
    PK: `USER#${validateId(userId)}`,
    SK: `PROJECT#${validateId(projectId)}`,
  }),
};

export type SingleTableItem =
  | ({ entity: "USER" } & ReturnType<typeof keys.user> & {
      id: string;
      name: string;
      email: string;
      createdAt: string;
    })
  | ({ entity: "PROJECT" } & ReturnType<typeof keys.project> & {
      id: string;
      title: string;
      description: string;
      createdAt: string;
    })
  | ({ entity: "USER_PROJECT" } & ReturnType<typeof keys.userProject> & {
      role: "owner" | "member";
      joinedAt: string;
    });
