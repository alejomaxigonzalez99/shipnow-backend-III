const logger = require('../config/logger.config');
const { LOG_LEVELS } = require('../constants');

class LoggerService {
  // Emite un mensaje por cada nivel y informa cuáles quedan activos en este entorno.
  static emitTestLogs() {
    const levels = Object.keys(LOG_LEVELS).sort((a, b) => LOG_LEVELS[b] - LOG_LEVELS[a]); // debug -> fatal

    const messages = {
      debug: 'Mensaje de prueba (debug): detalle útil solo en desarrollo',
      http: 'Mensaje de prueba (http): petición HTTP de ejemplo',
      info: 'Mensaje de prueba (info): evento normal del sistema',
      warning: 'Mensaje de prueba (warning): situación anómala no crítica',
      error: 'Mensaje de prueba (error): falló una operación',
      fatal: 'Mensaje de prueba (fatal): falla crítica simulada',
    };

    levels.forEach((level) => logger[level](messages[level]));

    return {
      nivelMinimoActivo: logger.level,
      niveles: levels.map((level) => ({
        nivel: level,
        registrado: logger.isLevelEnabled(level),
        archivoDeErrores: LOG_LEVELS[level] <= LOG_LEVELS.error,
      })),
      carpetaDeLogs: logger.logsDir,
    };
  }
}

module.exports = LoggerService;
