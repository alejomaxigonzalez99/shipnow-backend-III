
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
 * Logger centralizado (Winston).
 * Se utiliza desde cualquier archivo del proyecto.
 *
 * Desarrollo: consola + archivos.
 * Producción: solamente archivos.
 * Test: sin transportes de salida.
 *
 * Si env.config falla, el logger cae en modo desarrollo
 * para poder registrar el error de configuración.
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

const level = (() => {
  try {
    return require('./env.config').LOG_LEVEL;
  } catch {
    return LOG_LEVEL_BY_ENV[nodeEnv];
  }
})();

const logsDir = path.resolve(__dirname, '../..', LOG_CONFIG.DIR_NAME);

winston.addColors(LOG_COLORS);

const { combine, timestamp, errors, printf, colorize } = winston.format;

const timestampFormat = timestamp({
  format: LOG_CONFIG.TIMESTAMP_FORMAT,
});

// Construcción de cada línea de log.
const buildLine = (info, paintLevel = (_, text) => text) => {
  const {
    timestamp: ts,
    level: lvl,
    message,
    stack,
    ...meta
  } = info;

  const tag = paintLevel(lvl, `[${lvl}]`.padEnd(9));
  const metaText = Object.keys(meta).length > 0
    ? ` ${JSON.stringify(meta)}`
    : '';

  const stackText = stack ? `\n${stack}` : '';

  return `${ts} ${tag} ${message}${metaText}${stackText}`;
};

// Formato para archivos.
const fileFormat = combine(
  timestampFormat,
  errors({ stack: true }),
  printf((info) => buildLine(info))
);

// Formato para consola.
const colorizer = colorize({ colors: LOG_COLORS });

const consoleFormat = combine(
  timestampFormat,
  errors({ stack: true }),
  printf((info) =>
    buildLine(info, (lvl, text) => colorizer.colorize(lvl, text))
  )
);

// Configuración de rotación diaria.
const rotateOptions = {
  dirname: logsDir,
  datePattern: LOG_CONFIG.DATE_PATTERN,
  zippedArchive: true,
  maxSize: LOG_CONFIG.MAX_SIZE,
  maxFiles: LOG_CONFIG.MAX_FILES,
  format: fileFormat,
};

const transports = [];

// Consola únicamente en desarrollo.
if (nodeEnv === NODE_ENVS.DEVELOPMENT) {
  transports.push(
    new winston.transports.Console({
      level,
      format: consoleFormat,
    })
  );
}

// Archivos únicamente fuera del entorno de test.
if (!isTest) {
  transports.push(
    // Archivo exclusivo para errores y fallos fatales.
    new winston.transports.DailyRotateFile({
      ...rotateOptions,
      filename: LOG_CONFIG.ERROR_FILE,
      level: 'error',
    }),

    // Historial general de actividad.
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
  silent: isTest,
  exitOnError: false,
});
logger.logsDir = logsDir;

module.exports = logger;
