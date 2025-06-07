process.loadEnvFile("./.env");
const migrationConfig = {
    migrationsFolder: "./src/lib/db",
};
export const apiConfig = {
    fileServerHits: 0,
    db: {
        url: envOrThrow("DB_URL"),
        migrationConfig: migrationConfig
    },
    platform: envOrThrow("PLATFORM"),
    secret: envOrThrow("SECRET"),
    polkaKey: envOrThrow("POLKA_KEY"),
};
function envOrThrow(key) {
    const obj = process.env[key];
    if (obj === undefined || obj === "") {
        throw new Error("Missing variable.");
    }
    return obj;
}
