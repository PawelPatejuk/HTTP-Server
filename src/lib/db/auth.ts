import bcrypt from "bcrypt";
import { JwtPayload } from "jsonwebtoken";
import jwt from "jsonwebtoken";
import { Request } from "express";
import crypto from "node:crypto";
import { createRefreshToken } from "./queries/refresh_tokens.js";

export async function hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    const salt = await bcrypt.genSalt(saltRounds);
    const hash = await bcrypt.hash(password, salt);
    return hash;
}

export async function checkPasswordHash(password: string, hash: string): Promise<boolean> {
    const result = await bcrypt.compare(password, hash);
    return result;
}

type payload = Pick<JwtPayload, "iss" | "sub" | "iat" | "exp">;

export function makeJWT(userID: string, expiresIn: number, secret: string): string {
    const temp = Math.floor(Date.now() / 1000);
    const result  = jwt.sign(
        {
            iss: "chirpy",
            sub: userID,
            iat: temp,
            exp: temp + expiresIn
        } as payload,
        secret
    );
    return result;
}

export function validateJWT(tokenString: string, secret: string): string {
    const result = jwt.verify(tokenString, secret);
    if (typeof result === "string") {
        throw new Error("result is not payload");
    }
    if (!result.sub) {
        throw new Error("result.sub is undefined");
    }
    return result.sub as string;
}

export async function getBearerToken(req: Request) {
    const result = req.get("Authorization");
    if (!result) {
        throw new Error("TOKEN_STRING does not exist.");
    }
    return result.split(" ")[1];
}

export async function makeRefreshToken(userId: string) {
    const randomData = crypto.randomBytes(32).toString("hex");
    const result = await createRefreshToken(randomData, userId);
    if (!result) {
        throw new Error("Creating Refresh Token is Unsuccessful.");
    }
    return randomData;
}

export async function getAPIKey(req: Request) {
    const result = req.get("Authorization");
    if (!result) {
        throw new Error("POLKA_KEY does not exist.");   
    }
    return result.split(" ")[1];
}
