import logger from "../utils/logger.js";

const rawBodyMiddleware = (req, res, next) => {

    logger.step("rawBodyMiddleware — buffering raw body", {
        method: req.method,
        url: req.originalUrl
    });

    let data = [];

    req.on("data", (chunk) => {
        data.push(chunk);
    });

    req.on("end", () => {
        req.rawBody = Buffer.concat(data);

        logger.debug("Raw body buffered", { bytes: req.rawBody.length });

        try {
            req.body = req.rawBody.length > 0
                ? JSON.parse(req.rawBody)
                : {};

            logger.info("Body parsed as JSON", {
                event: req.headers["x-github-event"],
                action: req.body.action
            });

        } catch (err) {
            logger.warn("Body is not valid JSON — defaulting to {}", {
                error: err.message
            });
            req.body = {};
        }

        next();
    });

    req.on("error", (err) => {
        logger.error("Stream error reading request body", { error: err.message });
        res.status(500).send("Failed to read request body");
    });
};

export default rawBodyMiddleware;