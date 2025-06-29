import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "../database/db.js";
import { allSchemas } from "@smm-guru/database";
import { apiKey } from "better-auth/plugins";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg", // or "pg" or "mysql"
    schema: {
      ...allSchemas,
    },
  }),
  appName: "SMM Guru",
  baseURL: process.env.NODE_ENV === "production"
    ? "https://your-domain.com"
    : "http://localhost:8080",
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
  },
  advanced: {
    defaultCookieAttributes: {
      sameSite: "strict", // Prevent CSRF attacks
      secure: process.env.NODE_ENV === "production", // HTTPS only in production
      httpOnly: true, // Prevent XSS access to cookies
      maxAge: 60 * 60 * 24, // 24 hours
    },
  },
  plugins: [apiKey()],
});
