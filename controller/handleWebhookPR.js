import logger from "../utils/logger.js";
import { analyzePullRequest } from "../services/analysisService.js";


export async function handleWebhookPR(req, res) {

    const eventType = req.headers["x-github-event"];
    logger.info("Webhook received", { eventType, action: req.body?.action });


    if (eventType === "ping") {
        logger.info("Ping event — responding with pong");
        return res.json({ status: "pong" });
    }


    if (eventType !== "pull_request") {
        logger.info(`Ignoring non-PR event: ${eventType}`);
        return res.json({ status: "ignored" });
    }


    const action = req.body.action;

    if (!["opened", "synchronize", "reopened"].includes(action)) {
        logger.info(`Ignoring PR action: ${action}`);
        return res.json({ status: "ignored" });
    }


    logger.step(`Accepted PR event — action: ${action}`);
    res.status(202).json({ status: "accepted" });


    setImmediate(async () => {

        logger.step("Starting background analysis (setImmediate)");

        try {
            await analyzePullRequest(req.body);
            logger.success("✅ CodeLens analysis completed successfully");
        } catch (error) {
            logger.error("❌ CodeLens analysis failed", {
                message: error.message,
                stack: error.stack,
            });
        }

    });
}