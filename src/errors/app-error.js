const { ERROR_CODES, ERROR_DICTIONARY } = require('./error-dictionary');

/**
 * Error base de la aplicación. El status HTTP y el mensaje por defecto
 * salen del diccionario; así las capas solo lanzan un `code`.
 */
class AppError extends Error {
  constructor(code = ERROR_CODES.INTERNAL_ERROR, { message, details, cause } = {}) {
    const entry = ERROR_DICTIONARY[code] || ERROR_DICTIONARY[ERROR_CODES.INTERNAL_ERROR];
    super(message || entry.message, cause ? { cause } : undefined);
    this.name = this.constructor.name;
    this.code = ERROR_DICTIONARY[code] ? code : ERROR_CODES.INTERNAL_ERROR;
    this.statusCode = entry.status;
    this.details = details;
    this.isOperational = true; // error esperado, no un bug
  }
}

module.exports = AppError;
