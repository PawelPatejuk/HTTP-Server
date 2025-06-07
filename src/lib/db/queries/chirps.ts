import { db } from "../index.js";
import { chirps, type NewChirp } from "../schema.js";
import { eq, asc, desc } from "drizzle-orm";

export async function createChirp(chirp: NewChirp) {
    const [result] = await db.insert(chirps).values(chirp).onConflictDoNothing().returning();
    return result;
}

export async function getAllChirps(userId: string = "", sort: string) {
    const sortOrder = sort === "desc" ? desc(chirps.createdAt) : asc(chirps.createdAt);

    const result = db.select().from(chirps).orderBy(sortOrder);
    
    if (userId) {
        result.where(eq(chirps.userId, userId))
    }

    return await result;
}

export async function getChirp(chirpId: string) {
    const [result] = await db.select().from(chirps).where(eq(chirps.id, chirpId)).limit(1);
    return result;
}

export async function deleteChirp(chirpId: string) {
    await db.delete(chirps).where(eq(chirps.id, chirpId));
}

export async function getChirpAuthorId(chirpId: string) {
    const [chirp] = await db.select().from(chirps).where(eq(chirps.id, chirpId));
    return chirp.userId;
}
