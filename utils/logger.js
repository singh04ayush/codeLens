function timestamp() {
    return new Date().toISOString();
}

const logger = {
    info:    (msg, data) => data !== undefined ? console.log(`[${timestamp()}] [INFO]    ${msg}`, JSON.stringify(data, null, 2)) : console.log(`[${timestamp()}] [INFO]    ${msg}`),
    success: (msg, data) => data !== undefined ? console.log(`[${timestamp()}] [SUCCESS] ${msg}`, JSON.stringify(data, null, 2)) : console.log(`[${timestamp()}] [SUCCESS] ${msg}`),
    warn:    (msg, data) => data !== undefined ? console.warn(`[${timestamp()}] [WARN]    ${msg}`, JSON.stringify(data, null, 2)) : console.warn(`[${timestamp()}] [WARN]    ${msg}`),
    error:   (msg, data) => data !== undefined ? console.error(`[${timestamp()}] [ERROR]   ${msg}`, JSON.stringify(data, null, 2)) : console.error(`[${timestamp()}] [ERROR]   ${msg}`),
    debug:   (msg, data) => data !== undefined ? console.log(`[${timestamp()}] [DEBUG]   ${msg}`, JSON.stringify(data, null, 2)) : console.log(`[${timestamp()}] [DEBUG]   ${msg}`),
    step:    (msg, data) => data !== undefined ? console.log(`[${timestamp()}] [STEP]    ${msg}`, JSON.stringify(data, null, 2)) : console.log(`[${timestamp()}] [STEP]    ${msg}`),
};

export default logger;
