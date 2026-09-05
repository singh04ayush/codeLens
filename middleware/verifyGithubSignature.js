import crypto from "crypto";

const verifyGithubSignature = (req, res, next) => {
  const signatureHeader = req.headers['x-hub-signature-256'];

  if (!process.env.GITHUB_WEBHOOK_SECRET) {
    return res.status(500).send("No WebHook Secret Configured");
  }

  if (!signatureHeader) {
    return res.status(401).send("No signature header");
  }

  const received = signatureHeader.split("=")[1];

  const expected = crypto
    .createHmac('sha256', process.env.GITHUB_WEBHOOK_SECRET)
    .update(req.rawBody) 
    .digest('hex');

  const isValid = crypto.timingSafeEqual(
    Buffer.from(expected, 'hex'),
    Buffer.from(received, 'hex')
  );

  if (!isValid) {
    return res.status(401).send("Invalid signature");
  }

  next();
};

export default verifyGithubSignature;