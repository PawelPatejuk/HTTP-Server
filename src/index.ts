import express, { Request, Response, NextFunction } from "express";
import { apiConfig } from "./config.js";
import { createUser, deleteAllUsers, getUser, getUserById, update, upgradeUserToChirpyRed, validUser } from "./lib/db/queries/users.js";
import { type NewUser } from "./lib/db/schema.js";
import { createChirp, deleteChirp, getAllChirps, getChirp, getChirpAuthorId } from "./lib/db/queries/chirps.js";
import { hashPassword, checkPasswordHash, validateJWT, getBearerToken, makeJWT, makeRefreshToken, getAPIKey } from "./lib/db/auth.js";
import { getUserFromRefreshToken, isValid, revoke } from "./lib/db/queries/refresh_tokens.js";

const app = express();
const PORT = 8080;

app.use(express.json());
app.use(middlewareLogResponses)

app.use("/app", middlewareMetricsInc);
app.use("/admin/metrics", middlewareMetricsLog);
app.get("/admin/metrics", (req, res, next) => {
    res.set("Content-Type", "text/html; charset=utf-8");
    res.send(`
<html>
  <body>
    <h1>Welcome, Chirpy Admin</h1>
    <p>Chirpy has been visited ${apiConfig.fileServerHits} times!</p>
  </body>
</html>`
    );
});

app.use("/admin/reset", middlewareMetricsReset);
app.post("/admin/reset", resetHandler);

app.get("/api/healthz", (req, res, next) => {
    res.set("Content-Type", "text/plain; charset=utf-8");
    res.send("OK");
});

app.post("/api/users", createUserHandler);
app.put("/api/users", updateHandler);

app.post("/api/login", loginHandler);

app.post("/api/refresh", refreshHandler);

app.post("/api/revoke", revokeHandler);

app.post("/api/chirps", createChirpHandler)
app.get("/api/chirps", getAllChirpsHandler);
app.get("/api/chirps/:chirpID", getChirpHandler);
app.delete("/api/chirps/:chirpID", deleteChirpHandler);

app.post("/api/polka/webhooks", webhookHandler);

app.use("/app", express.static("./src/app"));

app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});

type Middleware = (req: Request, res: Response, next: NextFunction) => void;

function middlewareLogResponses(req: Request, res: Response, next: NextFunction): void {
    res.on("finish", () => {
        const statusCode = res.statusCode;
        if (statusCode < 200 || statusCode > 299) {
            console.log(`[NON-OK] ${req.method} ${req.url} - Status: ${statusCode}`);
        }
    });
    next();
}

function middlewareMetricsInc(req: Request, res: Response, next: NextFunction): void {
    apiConfig.fileServerHits++;
    next();
}

function middlewareMetricsLog(req: Request, res: Response, next: NextFunction): void {
    console.log(`Hits: ${apiConfig.fileServerHits}`);
    next();
}

function middlewareMetricsReset(req: Request, res: Response, next: NextFunction): void {
    apiConfig.fileServerHits = 0;
    next();
}
async function createUserHandler(req: Request, res: Response) {
    const email = req.body.email;
    const password = req.body.password;
    const hashedPassword = await hashPassword(password);
    const newUser: NewUser = {
        email: email,
        hashedPassword: hashedPassword,
        isChirpyRed: false
    };
    const result = await createUser(newUser);

    res.status(201).send(result);
    return;
}

async function resetHandler(req: Request, res: Response) {
    if (apiConfig.platform !== "dev") {
        res.status(403).send("Forbidden");
    }
    await deleteAllUsers();
    res.status(200).send("OK");
    return;
}

async function createChirpHandler(req: Request, res: Response) {
    const token = await getBearerToken(req);
    try {
        const userId = validateJWT(token, apiConfig.secret);

        const body = req.body.body;
        if (body.length > 140) {
            throw new Error400("Chirp is too long. Max length is 140");
        }
        
        const bannedWords = ["kerfuffle", "sharbert", "fornax"];
        const words = body.split(" ");
        let result = [];
        for (const word of words) {
            if (bannedWords.includes(word.toLowerCase())) {
                result.push("****");
            } else {
                result.push(word);
            }
        }   
        
        const chirp = {
            body: result.join(" ") as string,
            userId: userId as string
        }
        
        const newChirp = await createChirp(chirp);
    
        res.status(201).send(newChirp);
        return;
    } catch(err) {
        res.status(401).send("Token is not valid.");   
    }
}

async function getAllChirpsHandler(req: Request, res: Response) {
    const authorId = req.query.authorId;
    const sort = req.query.sort;
    
    const result = await getAllChirps(authorId as string, sort as string);

    res.status(200).send(result);
    return;
} 

async function getChirpHandler(req: Request, res: Response) {
    const chirpID = req.params["chirpID"]
    const result = await getChirp(chirpID);

    if (result !== undefined) {
        res.status(200).send(result);
        return;
    }
    res.status(404).send(`Chrip with id" ${chirpID} does not exsit.`);
    return;
}

async function loginHandler(req: Request, res: Response) {
    const email = req.body.email;
    const password = req.body.password;
    const expiresInSeconds = 3600;

    const user: NewUser = await getUser(email);
    if (!user) {
        res.status(401).send("Incorrect email or password");
        return;
    }

    const hashedPassword = user.hashedPassword;
    if (!hashedPassword) {
        res.status(401).send("Incorrect email or password");
        return;
    }

    const flag = await checkPasswordHash(password, hashedPassword as string); 
    if (flag) {
        const token = makeJWT(user.id as string, expiresInSeconds, apiConfig.secret);
        res.status(200).send({
            "id": user.id,
            "createdAt": user.createdAt?.toISOString(),
            "updatedAt": user.updatedAt?.toISOString(),
            "email": user.email,
            "token": token,
            "refreshToken": await makeRefreshToken(user.id as string),
            "isChirpyRed": user.isChirpyRed
        });
        return; 
    }

    res.status(401).send("Incorrect email or password");
    return;
}

async function refreshHandler(req: Request, res: Response) {
    const refreshToken = await getBearerToken(req);
    if (!await isValid(refreshToken)) {
        res.status(401).send("Token is expired or does not exist.");
        return;
    }

    const user = await getUserFromRefreshToken(refreshToken);
    if (!user) {
        throw new Error("User does not exist.");
    }
    
    const newToken = await makeJWT(user.id, 60 * 60 * 1000, apiConfig.secret)
    if (!newToken) {
        throw new Error("Token does not exist.");
    }

    res.status(200).send({
        token: newToken
    });
    return;
}

async function revokeHandler(req: Request, res: Response) {
    const refreshToken = await getBearerToken(req);
    if (! await isValid(refreshToken)) {
        res.status(401).send("Token is expired or does not exist.");
        return;
    }
    await revoke(refreshToken);
    res.status(204).send("Successful request. No response body returned.");
}

async function updateHandler(req: Request, res: Response) {
    const email = req.body.email;
    const password = req.body.password;
    const hashedPassword = await hashPassword(password);
    
    try {
        const accessToken = await getBearerToken(req);
        const userId = validateJWT(accessToken, apiConfig.secret);    
        await update(userId, email, hashedPassword);
        res.status(200).send(await getUserById(userId));
        return;
    } catch(err) {
        res.status(401).send("Token is not valid.");
        return;
    }
}

async function deleteChirpHandler(req: Request, res: Response) {
    const chirpId = req.params["chirpID"];
    const chirp = await getChirp(chirpId);
    if (!chirp) {
        res.status(404).send("Chirp not found.");
    }

    try {
        const accessToken = await getBearerToken(req);
        const userId = validateJWT(accessToken, apiConfig.secret);    
        const chirpAuthorId = await getChirpAuthorId(chirpId);

        if (userId !== chirpAuthorId) {
            res.status(403).send("User is not author of this chirp.");
            return;
        }

        await deleteChirp(chirpId);
        res.status(204).send("Chirp deleted successfully");
        return;
    } catch(err) {
        res.status(401).send("Token is not valid.");
        return;
    }
}

async function webhookHandler(req: Request, res: Response) {
    const event = req.body.event;
    if (event !== "user.upgraded") {
        res.status(204).send("Undefined event.");
        return;
    }

    try {
        const apiKey = await getAPIKey(req);
        if (apiKey !== apiConfig.polkaKey) {
            res.status(401).send("Wrong API Key.");
            return;
        }
    } catch (err) {
        res.status(401).send("Missing API Key.");
        return;
    }

    const userId = req.body.data.userId;
    const validatedUser = await validUser(userId);
    if (!validatedUser) {
        res.status(404).send("User can not be found.");
        return;
    }

    await upgradeUserToChirpyRed(userId);
    res.sendStatus(204)
    return;
}





























// Errors

class Error400 extends Error {
    constructor(message: string) {
        super(message);
    }
}

class Error401 extends Error {
    constructor(message: string) {
        super(message);
    }
}

class Error403 extends Error {
    constructor(message: string) {
        super(message);
    }
}

class Error404 extends Error {
    constructor(message: string) {
        super(message);
    }
}


function errorHandler(
    err: Error,
    req: Request,
    res: Response,
    next: NextFunction
) {
    console.log(err.name);
    if (err instanceof Error400) {
        res.status(400).json({
            "error": err.message
        });
    } else if (err instanceof Error401) {
        res.status(401).json({
            "error": err.message
        });
    } else if (err instanceof Error403) {
        res.status(403).json({
            "error": err.message
        });
    } else if (err instanceof Error404) {
        res.status(404).json({
            "error": err.message
        });
    } else {   
        res.status(500).json({
            "error": "Something went wrong on our end"
        })
    }
}

app.use(errorHandler);
