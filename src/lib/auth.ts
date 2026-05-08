import { betterAuth } from "better-auth";

const authSecret =
  process.env.BETTER_AUTH_SECRET ??
  process.env.AUTH_SECRET ??
  "replace-this-better-auth-secret-before-production";

export const auth = betterAuth({
  appName: "Next.js Tailwind Starter",
  secret: authSecret,
  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
  emailAndPassword: {
    enabled: true,
  },
});
