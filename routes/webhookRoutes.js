import express from "express";
import rawBodyMiddleware from "../middleware/rawBodyMiddleware.js";
import verifyGithubSignature from "../middleware/verifyGithubSignature.js";

const webhookRouter = express.Router();

webhookRouter.post("/github-webhooks", (req, res) => {
    console.log("HEADERS:", req.headers);
    console.log("BODY:", req.body);

    res.sendStatus(200);
});

export default webhookRouter;