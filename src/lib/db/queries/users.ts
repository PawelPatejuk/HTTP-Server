import { db } from "../index.js";
import { users } from "../schema.js";
import { type NewUser } from "../schema.js";
import { eq } from "drizzle-orm";

export async function createUser(user: NewUser): Promise<NewUser> {
    const [result] = await db.insert(users).values(user).onConflictDoNothing().returning();   
    return result;
}

export async function getUser(email: string): Promise<NewUser> {
    const [result] = await db.select().from(users).where(eq(users.email, email));
    return result;
}

export async function getUserById(userId: string) {
    const [result] = await db.select().from(users).where(eq(users.id, userId));
    return result;
}

export async function deleteAllUsers() {
    await db.delete(users);
}

export async function update(userId: string, email: string, hashedPassword: string) {
    await db.update(users).set({
        email: email,
        hashedPassword: hashedPassword
    }).where(eq(users.id, userId));
}

export async function upgradeUserToChirpyRed(userId: string) {
    await db.update(users).set({
        isChirpyRed: true
    }).where(eq(users.id, userId));
}

export async function validUser(userId: string) {
    const [result] = await db.select().from(users).where(eq(users.id, userId));
    return result;
}
