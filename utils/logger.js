const COLORS = {
    reset: "\x1b[0m",
    bright: "\x1b[1m",
    dim: "\x1b[2m",

    red: "\x1b[31m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    blue: "\x1b[34m",
    magenta: "\x1b[35m",
    cyan: "\x1b[36m",
    white: "\x1b[37m",
    gray: "\x1b[90m",
};


function timestamp() {
    return new Date().toISOString();
}


function fmt(color, label, message, data) {
    const prefix = `${COLORS.gray}[${timestamp()}]${COLORS.reset} ${color}${COLORS.bright}[${label}]${COLORS.reset}`;
    if (data !== undefined) {
        console.log(`${prefix} ${message}`);
        console.log(
            `${COLORS.dim}${JSON.stringify(data, null, 2)}${COLORS.reset}`
        );
    } else {
        console.log(`${prefix} ${message}`);
    }
}


const logger = {
    info:    (msg, data) => fmt(COLORS.cyan,    "INFO   ", msg, data),
    success: (msg, data) => fmt(COLORS.green,   "SUCCESS", msg, data),
    warn:    (msg, data) => fmt(COLORS.yellow,  "WARN   ", msg, data),
    error:   (msg, data) => fmt(COLORS.red,     "ERROR  ", msg, data),
    debug:   (msg, data) => fmt(COLORS.magenta, "DEBUG  ", msg, data),
    step:    (msg, data) => fmt(COLORS.blue,    "STEP   ", msg, data),
};


export default logger;
