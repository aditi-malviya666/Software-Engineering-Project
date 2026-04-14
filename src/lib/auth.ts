import { db } from "@/db/schema";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { betterAuth } from "better-auth";
import {
  accounts,
  users,
  userSessions,
  verification,
} from "../db/schema/auth-schema";

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3001",
  trustedOrigins: ["https://software-engineering-project-flax.vercel.app", "http://localhost:3001", "http://localhost:3000"],
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
    useSecureCookies: false,
    crossSubDomainCookies: {
      enabled: true,
    },
  },
  // hi
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
