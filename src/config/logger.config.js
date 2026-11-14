const path = require('path');
const winston = require('winston');
require('winston-daily-rotate-file');
const {
  NODE_ENVS,
  LOG_LEVELS,
  LOG_COLORS,
  LOG_LEVEL_BY_ENV,
  LOG_CONFIG,
} = require('../constants');

/**
 * Logger centralizado (Winston). Se importa desde cualquier archivo:
 *   const logger = require('../config/logger.config');
 *   logger.info('mensaje');
 *
 * Si la configuración de entorno es inválida (env.config lanza error) el logger
 * igual debe poder registrar esa falla fatal, así que cae en modo desarrollo.
 */
const resolveNodeEnv = () => {
  try {
    return require('./env.config').NODE_ENV;
  } catch (error) {
    return NODE_ENVS.DEVELOPMENT;
  }
};

const nodeEnv = resolveNodeEnv();
const isTest = nodeEnv === NODE_ENVS.TEST;
const level = LOG_LEVEL_BY_ENV[nodeEnv];
const logsDir = path.resolve(__dirname, '../..', LOG_CONFIG.DIR_NAME);

winston.addColors(LOG_COLORS);

const { combine, timestamp, errors, printf, colorize } = winston.format;

const timestampFormat = timestamp({ format: LOG_CONFIG.TIMESTAMP_FORMAT });

// "2026-08-01 10:12:03 [info]    mensaje {"meta":1}"
const buildLine = (info, paintLevel = (_, text) => text) => {
  const { timestamp: ts, level: lvl, message, stack, ...meta } = info;
  const tag = paintLevel(lvl, `[${lvl}]`.padEnd(9));
  const metaText = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : '';
  const stackText = stack ? `\n${stack}` : '';
  return `${ts} ${tag} ${message}${metaText}${stackText}`;
};

const fileFormat = combine(timestampFormat, errors({ stack: true }), printf((info) => buildLine(info)));

const colorizer = colorize({ colors: LOG_COLORS });
const consoleFormat = combine(
  timestampFormat,
  errors({ stack: true }),
  printf((info) => buildLine(info, (lvl, text) => colorizer.colorize(lvl, text)))
);

const rotateOptions = {
  dirname: logsDir,
  datePattern: LOG_CONFIG.DATE_PATTERN,
  zippedArchive: true,
  maxSize: LOG_CONFIG.MAX_SIZE,
  maxFiles: LOG_CONFIG.MAX_FILES,
  format: fileFormat,
};

const transports = [
  new winston.transports.Console({ level, format: consoleFormat }),
];

// En test no se escriben archivos.
if (!isTest) {
  transports.push(
    // Solo `error` y `fatal` (niveles <= error).
    new winston.transports.DailyRotateFile({
      ...rotateOptions,
      filename: LOG_CONFIG.ERROR_FILE,
      level: 'error',
    }),
    // Historial general, según el nivel del entorno.
    new winston.transports.DailyRotateFile({
      ...rotateOptions,
      filename: LOG_CONFIG.COMBINED_FILE,
      level,
    })
  );
}

const logger = winston.createLogger({
  levels: LOG_LEVELS,
  level,
  transports,
  exitOnError: false,
});

logger.logsDir = logsDir;

module.exports = logger;
