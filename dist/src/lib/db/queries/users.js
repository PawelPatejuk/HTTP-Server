import { db } from "..";
import { users } from "../schema";
export async function createUser(user) {
    const [result] = await db.insert(users).values(user).onConflictDoNothing().returning();
    return result;
}
export async function deleteAllUsers() {
    db.delete(users);
}
