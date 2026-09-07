import { analyzePullRequest } from "../services/analysisService.js";


export async function handleWebhookPR(req, res) {

    const eventType = req.headers["x-github-event"];


    if (eventType === "ping") {
        return res.json({ status: "pong" });
    }


    if (eventType !== "pull_request") {
        return res.json({ status: "ignored" });
    }


    const action = req.body.action;


    if (!["opened", "synchronize", "reopened"].includes(action)) {
        return res.json({ status: "ignored" });
    }


    res.status(202).json({
        status: "accepted"
    });


    setImmediate(async () => {

        try {

            await analyzePullRequest(req.body);

            console.log("✅ CodeLens analysis completed");

        } catch (error) {

            console.error(
                "❌ CodeLens analysis failed:",
                error
            );

        }

    });
}