import crypto from "crypto";
import logger from "../utils/logger.js";

const verifyGithubSignature = (req, res, next) => {

    logger.step("verifyGithubSignature — checking HMAC");

    const signatureHeader = req.headers["x-hub-signature-256"];

    if (!process.env.GITHUB_WEBHOOK_SECRET) {
        logger.error("GITHUB_WEBHOOK_SECRET is not set");
        return res.status(500).send("No WebHook Secret Configured");
    }

    if (!signatureHeader) {
        logger.warn("Request has no x-hub-signature-256 header — rejected");
        return res.status(401).send("No signature header");
    }

    const received = signatureHeader.split("=")[1];

    const expected = crypto
        .createHmac("sha256", process.env.GITHUB_WEBHOOK_SECRET)
        .update(req.rawBody)
        .digest("hex");

    const isValid = crypto.timingSafeEqual(
        Buffer.from(expected, "hex"),
        Buffer.from(received, "hex")
    );

    if (!isValid) {
        logger.warn("Signature mismatch — request rejected", {
            expected: expected.slice(0, 8) + "...",
            received: received.slice(0, 8) + "..."
        });
        return res.status(401).send("Invalid signature");
    }

    logger.success("Signature verified ✓");
    next();
};

export default verifyGithubSignature;