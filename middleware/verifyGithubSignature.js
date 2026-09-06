import crypto from "crypto";
import logger from "../utils/logger.js";

const verifyGithubSignature = (req, res, next) => {
    logger.step("verifyGithubSignature — checking webhook signature");

    const signatureHeader = req.headers["x-hub-signature-256"];

    if (!process.env.GITHUB_WEBHOOK_SECRET) {
        logger.error("GITHUB_WEBHOOK_SECRET is not set in environment");
        return res.status(500).send("No WebHook Secret Configured");
    }

    if (!signatureHeader) {
        logger.error("Missing x-hub-signature-256 header", {
            receivedHeaders: Object.keys(req.headers),
        });
        return res.status(401).send("No signature header");
    }

    logger.debug("Signature header received", { signatureHeader });

    const received = signatureHeader.split("=")[1];

    if (!req.rawBody) {
        logger.error("req.rawBody is undefined — rawBodyMiddleware may not have run or ran after express.json()");
        return res.status(500).send("Raw body missing");
    }

    const expected = crypto
        .createHmac("sha256", process.env.GITHUB_WEBHOOK_SECRET)
        .update(req.rawBody)
        .digest("hex");

    logger.debug("Signature comparison", {
        expected: expected.slice(0, 12) + "...",
        received: received.slice(0, 12) + "...",
        rawBodyLength: req.rawBody.length,
    });

    const isValid = crypto.timingSafeEqual(
        Buffer.from(expected, "hex"),
        Buffer.from(received, "hex")
    );

    if (!isValid) {
        logger.error("Signature mismatch — webhook secret may be wrong", {
            hint: "Check that GITHUB_WEBHOOK_SECRET in .env matches the secret set on your GitHub App webhook settings",
        });
        return res.status(401).send("Invalid signature");
    }

    logger.success("Signature verified ✓");
    next();
};

export default verifyGithubSignature;