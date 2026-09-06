import express from "express";
import cors from "cors";
import 'dotenv/config'

import webhookRoutes from "./routes/webhookRoutes.js";

const PORT = process.env.PORT

const app = express();

app.use(cors({ origin: '*' }))

app.use("/api", webhookRoutes);

app.get('/', (req, res) => {
    res.send('CodeLens Server Working')
})

app.listen(PORT, () => {
    console.log(`CodeLens Server is running on port ${PORT}`)
})