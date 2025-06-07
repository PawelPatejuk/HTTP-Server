import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import * as schema from "./schema.js";
import { apiConfig } from "../../../config.js";
const migrationClient = postgres(apiConfig.db.url, { max: 1 });
await migrate(drizzle(migrationClient), apiConfig.db.migrationConfig);
const conn = postgres(apiConfig.db.url);
export const db = drizzle(conn, { schema });
