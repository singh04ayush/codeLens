import express from "express";
import rawBodyMiddleware from "../middleware/rawBodyMiddleware.js";

const webhookRouter = express.Router();

webhookRouter.post("/", rawBodyMiddleware, (req, res) => {
  console.log(req.rawBody.toString());
  console.log(req.body);

  res.sendStatus(200);
});

export default webhookRouter;