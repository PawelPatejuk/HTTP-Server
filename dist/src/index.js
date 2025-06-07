import express from "express";
import { apiConfig } from "../config.js";
import { createUser, deleteAllUsers } from "./lib/db/queries/users.js";
const app = express();
const PORT = 8080;
app.use(express.json());
app.use(middlewareLogResponses);
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
</html>`);
});
app.use("/admin/reset", middlewareMetricsReset);
app.post("/admin/reset", resetHandler);
app.post("/api/validate_chirp", validateChirpHandler);
app.get("/api/healthz", (req, res, next) => {
    res.set("Content-Type", "text/plain; charset=utf-8");
    res.send("OK");
});
app.post("/api/users", createUserHandler);
app.use("/app", express.static("./src/app"));
app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});
function middlewareLogResponses(req, res, next) {
    res.on("finish", () => {
        const statusCode = res.statusCode;
        if (statusCode < 200 || statusCode > 299) {
            console.log(`[NON-OK] ${req.method} ${req.url} - Status: ${statusCode}`);
        }
    });
    next();
}
function middlewareMetricsInc(req, res, next) {
    apiConfig.fileServerHits++;
    next();
}
function middlewareMetricsLog(req, res, next) {
    console.log(`Hits: ${apiConfig.fileServerHits}`);
    next();
}
function middlewareMetricsReset(req, res, next) {
    apiConfig.fileServerHits = 0;
    next();
}
function validateChirpHandler(req, res) {
    if (req.body.body.length > 140) {
        throw new Error400("Chirp is too long. Max length is 140");
    }
    const bannedWords = ["kerfuffle", "sharbert", "fornax"];
    const words = req.body.body.split(" ");
    let result = [];
    for (const word of words) {
        if (bannedWords.includes(word.toLowerCase())) {
            result.push("****");
        }
        else {
            result.push(word);
        }
    }
    res.status(200).send({
        "cleanedBody": result.join(" ")
    });
    return;
}
function createUserHandler(req, res) {
    const email = req.body.email;
    const newUser = {
        email: email,
    };
    const result = createUser(newUser);
    res.status(201).send(result);
}
function resetHandler(req, res) {
    if (apiConfig.platform !== "dev") {
        res.status(403).send("Forbidden");
    }
    deleteAllUsers();
    res.status(200).send("OK");
}
// Errors
class Error400 extends Error {
    constructor(message) {
        super(message);
    }
}
class Error401 extends Error {
    constructor(message) {
        super(message);
    }
}
class Error403 extends Error {
    constructor(message) {
        super(message);
    }
}
class Error404 extends Error {
    constructor(message) {
        super(message);
    }
}
function errorHandler(err, req, res, next) {
    console.log(err.name);
    if (err instanceof Error400) {
        res.status(400).json({
            "error": err.message
        });
    }
    else if (err instanceof Error401) {
        res.status(401).json({
            "error": err.message
        });
    }
    else if (err instanceof Error403) {
        res.status(403).json({
            "error": err.message
        });
    }
    else if (err instanceof Error404) {
        res.status(404).json({
            "error": err.message
        });
    }
    else {
        res.status(500).json({
            "error": "Something went wrong on our end"
        });
    }
}
app.use(errorHandler);
