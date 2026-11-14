const logger = require('./config/logger.config');

const FLUSH_TIMEOUT_MS = 1500;

// Cierra el logger dejando que se escriban los archivos antes de salir.
const exitAfterFlush = (code) => {
  process.exitCode = code;
  logger.on('finish', () => setTimeout(() => process.exit(code), 100));
  logger.end();
  setTimeout(() => process.exit(code), FLUSH_TIMEOUT_MS).unref();
};

const fatal = (message, error) => {
  logger.fatal(message, error ? { stack: error.stack } : undefined);
  exitAfterFlush(1);
};

// Una falla de configuración (variables de entorno) es fatal: no se puede arrancar.
let config;
try {
  config = require('./config/env.config');
} catch (error) {
  fatal(error.message);
}

if (config) {
  const connectDB = require('./config/db.config');
  const app = require('./app');

  process.on('uncaughtException', (error) => fatal(`Excepción no capturada: ${error.message}`, error));
  process.on('unhandledRejection', (reason) => {
    const error = reason instanceof Error ? reason : new Error(String(reason));
    fatal(`Promesa rechazada sin manejar: ${error.message}`, error);
  });

  const start = async () => {
    await connectDB();
    app.listen(config.PORT, () => {
      logger.info(`Servidor ShipNow escuchando en el puerto ${config.PORT} (${config.NODE_ENV})`);
    });
  };

  start().catch((error) => fatal(`No se pudo iniciar el servidor: ${error.message}`, error));
}
