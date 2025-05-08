import { DATABASE_URL } from "@/lib/env";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  out: "../../drizzle",
  schema: "../../packages/database/src/lib/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: DATABASE_URL,
  },
});
