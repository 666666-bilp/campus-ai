/** Simple logger utility with timestamps and log levels. */
const LOG_LEVELS = { debug: 0, info: 1, warn: 2, error: 3 };
const currentLevel = LOG_LEVELS[process.env.LOG_LEVEL] ?? LOG_LEVELS.info;

function formatTimestamp() { return new Date().toISOString(); }
function shouldLog(level) { return LOG_LEVELS[level] >= currentLevel; }

function formatMessage(level, message, meta) {
  const timestamp = formatTimestamp();
  const prefix = `[${timestamp}] [${level.toUpperCase().padEnd(5)}]`;
  let output = `${prefix} ${message}`;
  if (meta && Object.keys(meta).length > 0) {
    try { output += ` ${JSON.stringify(meta)}`; } catch { output += ` [Unserializable metadata]`; }
  }
  return output;
}

const logger = {
  debug(message, meta) { if (shouldLog('debug')) console.debug(formatMessage('debug', message, meta)); },
  info(message, meta) { if (shouldLog('info')) console.info(formatMessage('info', message, meta)); },
  warn(message, meta) { if (shouldLog('warn')) console.warn(formatMessage('warn', message, meta)); },
  error(message, meta) { if (shouldLog('error')) console.error(formatMessage('error', message, meta)); },
  child(namespace) {
    const prefix = `[${namespace}]`;
    return {
      debug: (msg, meta) => logger.debug(`${prefix} ${msg}`, meta),
      info: (msg, meta) => logger.info(`${prefix} ${msg}`, meta),
      warn: (msg, meta) => logger.warn(`${prefix} ${msg}`, meta),
      error: (msg, meta) => logger.error(`${prefix} ${msg}`, meta),
    };
  },
};

module.exports = logger;
