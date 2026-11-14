const config = require('../config/env.config');
const logger = require('../config/logger.config');
const {
  AppError,
  ERROR_CODES,
  ERROR_DICTIONARY,
  RouteNotFoundError,
  InvalidIdError,
  ValidationError,
} = require('../errors');

const DB_UNAVAILABLE_ERRORS = new Set([
  'MongooseServerSelectionError',
  'MongoServerSelectionError',
  'MongoNetworkError',
  'MongoNotConnectedError',
]);

const MONGO_DUPLICATE_KEY = 11000;

/**
 * Convierte cualquier error (propio, de Mongoose, de body-parser o desconocido)
 * en un AppError. Es el único lugar que conoce los errores de librerías.
 */
const normalizeError = (err) => {
  if (err instanceof AppError) return err;

  // JSON mal formado en el body
  if (err.type === 'entity.parse.failed') {
    return new AppError(ERROR_CODES.INVALID_JSON, { cause: err });
  }

  // Mongoose: ID con formato inválido
  if (err.name === 'CastError') {
    return new InvalidIdError(err.value);
  }

  // Mongoose: el documento no cumple el esquema
  if (err.name === 'ValidationError' && err.errors) {
    const fields = Object.values(err.errors).map((e) => ({ field: e.path, message: e.message }));
    return new ValidationError(fields);
  }

  // MongoDB: índice único violado
  if (err.code === MONGO_DUPLICATE_KEY) {
    return new AppError(ERROR_CODES.DUPLICATE_KEY, {
      details: { fields: Object.keys(err.keyValue || {}) },
      cause: err,
    });
  }

  // Base de datos caída / sin conexión
  const isBufferingTimeout = err.name === 'MongooseError' && /buffering timed out/i.test(err.message);
  if (DB_UNAVAILABLE_ERRORS.has(err.name) || isBufferingTimeout) {
    return new AppError(ERROR_CODES.DATABASE_UNAVAILABLE, { cause: err });
  }

  // Cualquier otra cosa es un bug no previsto
  return new AppError(ERROR_CODES.INTERNAL_ERROR, { cause: err });
};

// 404 para rutas que no existen: delega al middleware global.
const notFoundHandler = (req, res, next) => {
  next(new RouteNotFoundError(req.method, req.originalUrl));
};

// Único punto de salida de errores hacia el cliente.
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  const appError = normalizeError(err);
  const isServerError = appError.statusCode >= 500;

  // Errores esperados (4xx) -> warning. Errores inesperados (5xx) -> error con stack.
  const summary = `${req.method} ${req.originalUrl} -> ${appError.statusCode} ${appError.code}: ${appError.message}`;
  if (isServerError) {
    const original = appError.cause || err;
    logger.error(summary, { stack: original.stack || String(original) });
  } else {
    logger.warning(summary);
  }

  // En producción no se expone el mensaje ni el detalle de errores 5xx.
  const hideInternals = isServerError && config.IS_PRODUCTION;
  const message = hideInternals ? ERROR_DICTIONARY[appError.code].message : appError.message;

  res.status(appError.statusCode).json({
    status: 'error',
    statusCode: appError.statusCode,
    error: {
      code: appError.code,
      message,
      ...(appError.details !== undefined && !hideInternals ? { details: appError.details } : {}),
    },
    path: req.originalUrl,
    timestamp: new Date().toISOString(),
  });
};

module.exports = { errorHandler, notFoundHandler, normalizeError };
