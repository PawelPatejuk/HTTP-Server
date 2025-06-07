import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "src/lib/db/schema.ts",
  out: "src/lib/db",
  dialect: "postgresql",
  dbCredentials: {
    url: "postgres://postgres:password@localhost:5432/chirpy?sslmode=disable",
  },
});
