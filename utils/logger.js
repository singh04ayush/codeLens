// Simple structured logger using console — no external dependencies.
// Emits timestamped, emoji-tagged lines for easy log scanning.

function timestamp() {
    return new Date().toISOString();
}

const logger = {

    // High-level pipeline steps (green arrow)
    step(msg, meta) {
        const extra = meta ? ` ${JSON.stringify(meta)}` : "";
        console.log(`[${timestamp()}] ➡️  ${msg}${extra}`);
    },

    // Informational (blue)
    info(msg, meta) {
        const extra = meta ? ` ${JSON.stringify(meta)}` : "";
        console.log(`[${timestamp()}] ℹ️  ${msg}${extra}`);
    },

    // Successful completion (green tick)
    success(msg, meta) {
        const extra = meta ? ` ${JSON.stringify(meta)}` : "";
        console.log(`[${timestamp()}] ✅ ${msg}${extra}`);
    },

    // Non-fatal warnings (yellow)
    warn(msg, meta) {
        const extra = meta ? ` ${JSON.stringify(meta)}` : "";
        console.warn(`[${timestamp()}] ⚠️  ${msg}${extra}`);
    },

    // Errors (red) — written to both stdout and stderr so they appear in all log viewers
    error(msg, meta) {
        const extra = meta ? ` ${JSON.stringify(meta)}` : "";
        const line = `[${timestamp()}] ❌ ${msg}${extra}`;
        console.log(line);
        console.error(line);
    },

    // Verbose debug details (grey — only useful when tailing logs closely)
    debug(msg, meta) {
        const extra = meta ? ` ${JSON.stringify(meta)}` : "";
        console.log(`[${timestamp()}] 🔎 ${msg}${extra}`);
    }
};

export default logger;
