import logger from "../utils/logger.js";

const rawBodyMiddleware = (req, res, next) => {
    logger.step("rawBodyMiddleware — buffering raw body");

    let data = [];

    req.on("data", (chunk) => {
        data.push(chunk);
        logger.debug(`Received chunk`, { bytes: chunk.length });
    });

    req.on("end", () => {
        req.rawBody = Buffer.concat(data);
        logger.info(`Raw body buffered`, { totalBytes: req.rawBody.length });

        try {
            req.body = req.rawBody.length > 0
                ? JSON.parse(req.rawBody)
                : {};

            logger.info("Body parsed as JSON", {
                keys: Object.keys(req.body),
                action: req.body.action,
                event: req.headers["x-github-event"],
            });
        } catch (err) {
            logger.warn("Failed to parse body as JSON — defaulting to {}", {
                error: err.message,
                rawSnippet: req.rawBody.slice(0, 200).toString(),
            });
            req.body = {};
        }

        next();
    });

    req.on("error", (err) => {
        logger.error("Stream error while reading request body", { error: err.message });
        res.status(500).send("Failed to read request body");
    });
};

export default rawBodyMiddleware;