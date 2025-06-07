import type { MigrationConfig } from "drizzle-orm/migrator";

process.loadEnvFile("./.env");

type APIConfig = {
  fileServerHits: number;
  db: {
    url: string,
    migrationConfig: MigrationConfig;
  };
  platform: string;
  secret: string;
  polkaKey: string;
};

export type DBConfig = {
  dbURL: string,
  migrationConfig: MigrationConfig
}

const migrationConfig: MigrationConfig = {
  migrationsFolder: "./src/lib/db",
};

export const apiConfig: APIConfig = {
    fileServerHits: 0,
    db: {
      url: envOrThrow("DB_URL"),
      migrationConfig: migrationConfig
    },
    platform: envOrThrow("PLATFORM"),
    secret: envOrThrow("SECRET"),
    polkaKey: envOrThrow("POLKA_KEY"),
};

function envOrThrow(key: string) {
  const obj = process.env[key];
  if (obj === undefined || obj === "") {
    throw new Error("Missing variable.");
  }
  return obj;
}
