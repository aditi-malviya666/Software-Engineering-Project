import { nextCookies } from "better-auth/next-js";
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: typeof window !== "undefined" ? window.location.origin : undefined,
  plugins: [nextCookies()],
});
