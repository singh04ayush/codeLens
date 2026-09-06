import express from "express";
import rawBodyMiddleware from "../middleware/rawBodyMiddleware.js";
import verifyGithubSignature from "../middleware/verifyGithubSignature.js";
import { handleWebhookPR } from "../controller/handleWebhookPR.js";

const webhookRouter = express.Router();

webhookRouter.post("/github-webhooks", rawBodyMiddleware, verifyGithubSignature, handleWebhookPR);

export default webhookRouter;