// src/assets/utils/logger.js

const LEVEL_MAP = {
  debug: 'debug',
  info: 'info',
  warn: 'warn',
  error: 'error',
};

const shouldLog = (level) => {
  if (typeof window === 'undefined') return false;
  const env = import.meta.env.MODE || 'development';
  if (env === 'production' && level === 'debug') {
    return false;
  }
  return true;
};

const formatMessage = (level, message) => {
  const ts = new Date().toISOString();
  return `[Praxis][${level.toUpperCase()}][${ts}] ${message}`;
};

const emit = (level, message, ...details) => {
  if (!shouldLog(level)) return;
  const consoleMethod = LEVEL_MAP[level] || 'log';
  console[consoleMethod](formatMessage(level, message), ...details);
};

const logger = {
  debug: (message, ...details) => emit('debug', message, ...details),
  info: (message, ...details) => emit('info', message, ...details),
  warn: (message, ...details) => emit('warn', message, ...details),
  error: (message, ...details) => emit('error', message, ...details),
  event: (name, payload = {}) =>
    emit('info', `event:${name}`, payload),
};

export default logger;


