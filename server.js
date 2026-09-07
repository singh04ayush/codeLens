import express from "express";
import cors from "cors";
import 'dotenv/config'

import webhookRoutes from "./routes/webhookRoutes.js";

// ─── Global error safety net ─────────────────────────────────────────────────
// Catches any promise that rejects without a .catch() and async errors that
// escape all try/catch blocks — logs them so they are never silently swallowed.
process.on('unhandledRejection', (reason, promise) => {
    console.log('[UNHANDLED REJECTION] A promise rejected without a handler:');
    console.log('  Reason :', reason);
    console.log('  Promise:', promise);
});

process.on('uncaughtException', (err) => {
    console.log('[UNCAUGHT EXCEPTION] An exception was thrown outside try/catch:');
    console.log('  Error  :', err.message);
    console.log('  Stack  :', err.stack);
});
// ─────────────────────────────────────────────────────────────────────────────

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