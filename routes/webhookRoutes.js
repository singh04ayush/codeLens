import express from "express";
import rawBodyMiddleware from "../middleware/rawBodyMiddleware.js";
import verifyGithubSignature from "../middleware/verifyGithubSignature.js";

const webhookRouter = express.Router();

webhookRouter.post("/github-webhooks", rawBodyMiddleware, verifyGithubSignature, (req, res) => {
    console.log("Webhook verified");
    console.log(req.body);

    res.sendStatus(200);
});

export default webhookRouter;