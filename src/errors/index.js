const AppError = require('./app-error');
const { ERROR_CODES, ERROR_DICTIONARY } = require('./error-dictionary');
const domainErrors = require('./domain-errors');

module.exports = { AppError, ERROR_CODES, ERROR_DICTIONARY, ...domainErrors };
