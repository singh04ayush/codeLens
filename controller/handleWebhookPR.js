import { analyzePullRequest } from "../services/analysisService.js";
import logger from "../utils/logger.js";


export async function handleWebhookPR(req, res) {

    const eventType = req.headers["x-github-event"];

    logger.step("handleWebhookPR — incoming event", { event: eventType });


    if (eventType === "ping") {
        logger.info("Ping received — responding pong");
        return res.json({ status: "pong" });
    }


    if (eventType !== "pull_request") {
        logger.info("Event is not pull_request — ignoring", { event: eventType });
        return res.json({ status: "ignored" });
    }


    const action = req.body.action;
    const prNumber = req.body.pull_request?.number;
    const repo = `${req.body.repository?.owner?.login}/${req.body.repository?.name}`;

    logger.info("pull_request event received", { action, pr: prNumber, repo });


    if (!["opened", "synchronize", "reopened"].includes(action)) {
        logger.info("Action not handled — ignoring", { action });
        return res.json({ status: "ignored" });
    }


    // Respond immediately so GitHub doesn't time out waiting for us.
    res.status(202).json({ status: "accepted" });
    logger.success(`202 Accepted sent to GitHub for PR #${prNumber}`);


    setImmediate(async () => {

        logger.step(`Starting async analysis for PR #${prNumber} in ${repo}`);

        try {

            await analyzePullRequest(req.body);

            logger.success(`CodeLens analysis completed for PR #${prNumber}`);

        } catch (error) {

            logger.error(`CodeLens analysis failed for PR #${prNumber}`, {
                name: error.name,
                message: error.message,
                status: error.status ?? error.response?.status,
                responseData: error.response?.data ?? error.response?.body,
                stack: error.stack
            });

        }

    });
}