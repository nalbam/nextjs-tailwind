"use client";

import { createAuthClient } from "better-auth/react";

import { clientEnv } from "@/lib/env";

const baseURL =
  clientEnv.NEXT_PUBLIC_BETTER_AUTH_URL ??
  (typeof window !== "undefined" ? window.location.origin : "http://localhost:3000");

export const authClient = createAuthClient({
  baseURL,
});
