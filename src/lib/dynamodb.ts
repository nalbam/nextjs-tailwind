import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

const region = process.env.AWS_REGION ?? "ap-northeast-2";

export const tableName = process.env.DYNAMODB_TABLE_NAME ?? "app-main";

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
    PK: `USER#${userId}`,
    SK: "PROFILE",
  }),
  project: (projectId: string) => ({
    PK: `PROJECT#${projectId}`,
    SK: "META",
  }),
  userProject: (userId: string, projectId: string) => ({
    PK: `USER#${userId}`,
    SK: `PROJECT#${projectId}`,
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
