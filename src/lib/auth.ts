import { db } from "@/db/schema";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { betterAuth } from "better-auth";
import {
  accounts,
  users,
  userSessions,
  verification,
} from "../db/schema/auth-schema";

const getBaseURL = () => {
  if (process.env.BETTER_AUTH_URL) return process.env.BETTER_AUTH_URL;
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "https://precisionprep.vercel.app";
};

export const auth = betterAuth({
  baseURL: getBaseURL(),
  trustedOrigins: [
    "http://localhost:3000",
    "http://localhost:3001",
    "https://precisionprep.vercel.app",
    ...(process.env.VERCEL_URL ? [`https://${process.env.VERCEL_URL}`] : []),
    ...(process.env.VERCEL_PROJECT_PRODUCTION_URL ? [`https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`] : []),
    ...(process.env.BETTER_AUTH_URL ? [process.env.BETTER_AUTH_URL] : []),
  ],
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      users: users,
      accounts: accounts,
      user_sessions: userSessions,
      verification: verification,
    },
  }),
  emailAndPassword: {
    enabled: true,
  },
  advanced: {
    useSecureCookies: process.env.NODE_ENV === "production",
    crossSubDomainCookies: {
      enabled: true,
    },
  },
  session: {
    modelName: "user_sessions",
  },
  user: {
    modelName: "users",
  },
  account: {
    modelName: "accounts",
  },
});
