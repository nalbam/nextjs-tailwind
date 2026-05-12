"use client";

import { createAuthClient } from "better-auth/react";

import { clientEnv } from "@/lib/env";

const resolveBaseURL = (): string => {
  if (clientEnv.NEXT_PUBLIC_BETTER_AUTH_URL) {
    return clientEnv.NEXT_PUBLIC_BETTER_AUTH_URL;
  }
  if (typeof window === "undefined") {
    return "http://localhost:3000";
  }
  // In production, NEXT_PUBLIC_BETTER_AUTH_URL must be set so the client
  // points at the same origin as Better Auth's server. Falling back to
  // window.location.origin silently masks misconfiguration (and breaks on
  // multi-domain deployments where the API lives on a different host).
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "NEXT_PUBLIC_BETTER_AUTH_URL must be set in production. " +
        "Set it to the public URL of the Better Auth server (matches BETTER_AUTH_URL).",
    );
  }
  return window.location.origin;
};

export const authClient = createAuthClient({
  baseURL: resolveBaseURL(),
});
