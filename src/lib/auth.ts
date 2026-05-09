import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";

import { dynamodbAdapter } from "@/lib/auth/dynamodb-adapter";
import { hasSecondaryStorage, secondaryStorage } from "@/lib/auth/secondary-storage";
import { clientEnv, getServerEnv, trustedOriginsList } from "@/lib/env";

const createAuthInstance = () => {
  const env = getServerEnv();
  const trustedOrigins = trustedOriginsList(env);
  return betterAuth({
    appName: clientEnv.NEXT_PUBLIC_APP_NAME,
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.BETTER_AUTH_URL ?? clientEnv.NEXT_PUBLIC_BETTER_AUTH_URL,
    trustedOrigins,
    database: dynamodbAdapter,
    secondaryStorage: hasSecondaryStorage() ? secondaryStorage : undefined,
    emailAndPassword: {
      enabled: true,
    },
    advanced: {
      cookies: {
        sessionToken: {
          attributes: {
            sameSite: "lax",
            httpOnly: true,
            secure: env.NODE_ENV === "production",
          },
        },
      },
    },
    plugins: [nextCookies()],
  });
};

type AuthInstance = ReturnType<typeof createAuthInstance>;

let authInstance: AuthInstance | undefined;

export const getAuth = (): AuthInstance => {
  if (authInstance) return authInstance;
  authInstance = createAuthInstance();
  return authInstance;
};
