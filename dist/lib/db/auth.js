import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "node:crypto";
import { createRefreshToken } from "./queries/refresh_tokens.js";
export async function hashPassword(password) {
    const saltRounds = 10;
    const salt = await bcrypt.genSalt(saltRounds);
    const hash = await bcrypt.hash(password, salt);
    return hash;
}
export async function checkPasswordHash(password, hash) {
    const result = await bcrypt.compare(password, hash);
    return result;
}
export function makeJWT(userID, expiresIn, secret) {
    const temp = Math.floor(Date.now() / 1000);
    const result = jwt.sign({
        iss: "chirpy",
        sub: userID,
        iat: temp,
        exp: temp + expiresIn
    }, secret);
    return result;
}
export function validateJWT(tokenString, secret) {
    const result = jwt.verify(tokenString, secret);
    if (typeof result === "string") {
        throw new Error("result is not payload");
    }
    if (!result.sub) {
        throw new Error("result.sub is undefined");
    }
    return result.sub;
}
export async function getBearerToken(req) {
    const result = req.get("Authorization");
    if (!result) {
        throw new Error("TOKEN_STRING does not exist.");
    }
    return result.split(" ")[1];
}
export async function makeRefreshToken(userId) {
    const randomData = crypto.randomBytes(32).toString("hex");
    const result = await createRefreshToken(randomData, userId);
    if (!result) {
        throw new Error("Creating Refresh Token is Unsuccessful.");
    }
    return randomData;
}
export async function getAPIKey(req) {
    const result = req.get("Authorization");
    if (!result) {
        throw new Error("POLKA_KEY does not exist.");
    }
    return result.split(" ")[1];
}
