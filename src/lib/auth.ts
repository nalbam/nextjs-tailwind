import { betterAuth } from "better-auth";

const getAuthSecret = () => {
  const secret = process.env.BETTER_AUTH_SECRET ?? process.env.AUTH_SECRET;

  if (!secret) {
    throw new Error("BETTER_AUTH_SECRET (or AUTH_SECRET) must be set.");
  }

  return secret;
};

const createAuthInstance = () =>
  betterAuth({
    appName: process.env.NEXT_PUBLIC_APP_NAME ?? "Next.js Tailwind Starter",
    secret: getAuthSecret(),
    baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
    emailAndPassword: {
      enabled: true,
    },
  });

type AuthInstance = ReturnType<typeof createAuthInstance>;

let authInstance: AuthInstance | undefined;

export const getAuth = () => {
  if (authInstance) {
    return authInstance;
  }

  authInstance = createAuthInstance();

  return authInstance;
};
