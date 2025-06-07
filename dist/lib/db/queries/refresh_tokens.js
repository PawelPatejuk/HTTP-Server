import { refresh_tokens } from "../schema.js";
import { db } from "../index.js";
import { eq } from "drizzle-orm";
import { getUserById } from "./users.js";
export async function createRefreshToken(data, userId) {
    const result = await db.insert(refresh_tokens).values({
        token: data,
        userId: userId,
        expiresAt: new Date(new Date().getTime() + (60 * 24 * 60 * 60 * 1000)),
        revokedAt: null
    }).returning();
    return result;
}
export async function getExpirationTime(token) {
    const result = await db.select({
        expiresAt: refresh_tokens.expiresAt
    }).from(refresh_tokens).where(eq(refresh_tokens.token, token));
    return result;
}
export async function getUserFromRefreshToken(token) {
    const [result] = await db.select().from(refresh_tokens).where(eq(refresh_tokens.token, token));
    const user = await getUserById(result.userId);
    return user;
}
export async function isValid(token) {
    const [result] = await db.select().from(refresh_tokens).where(eq(refresh_tokens.token, token));
    if (!result || result.revokedAt) {
        return false;
    }
    if (new Date().getTime() > result.expiresAt.getTime()) {
        return false;
    }
    return true;
}
export async function revoke(token) {
    await db.update(refresh_tokens).set({
        updatedAt: new Date(),
        revokedAt: new Date()
    }).where(eq(refresh_tokens.token, token));
}
