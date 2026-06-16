import { defineConfig } from "drizzle-kit";

// Uses DIRECT_URL (session pooler, port 5432) for migrations; the app runtime
// uses DATABASE_URL (transaction pooler, port 6543). Mirrors Hearth.
export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? "",
  },
});
