import { db } from "../index.js";
import { users } from "../schema.js";
import { eq } from "drizzle-orm";
export async function createUser(user) {
    const [result] = await db.insert(users).values(user).onConflictDoNothing().returning();
    return result;
}
export async function getUser(email) {
    const [result] = await db.select().from(users).where(eq(users.email, email));
    return result;
}
export async function getUserById(userId) {
    const [result] = await db.select().from(users).where(eq(users.id, userId));
    return result;
}
export async function deleteAllUsers() {
    await db.delete(users);
}
export async function update(userId, email, hashedPassword) {
    await db.update(users).set({
        email: email,
        hashedPassword: hashedPassword
    }).where(eq(users.id, userId));
}
export async function upgradeUserToChirpyRed(userId) {
    await db.update(users).set({
        isChirpyRed: true
    }).where(eq(users.id, userId));
}
export async function validUser(userId) {
    const [result] = await db.select().from(users).where(eq(users.id, userId));
    return result;
}
