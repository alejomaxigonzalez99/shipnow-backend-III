const mongoose = require('mongoose');
const config = require('./env.config');
const logger = require('./logger.config');

const SERVER_SELECTION_TIMEOUT_MS = 5000;

let listenersRegistered = false;

const registerConnectionListeners = () => {
  if (listenersRegistered) return;
  listenersRegistered = true;
  mongoose.connection.on('disconnected', () => logger.warning('Conexión a MongoDB perdida'));
  mongoose.connection.on('reconnected', () => logger.info('Conexión a MongoDB restablecida'));
  mongoose.connection.on('error', (error) => logger.error(`Error en la conexión a MongoDB: ${error.message}`));
};

const connectDB = async () => {
  try {
    await mongoose.connect(config.MONGODB_URI, {
      serverSelectionTimeoutMS: SERVER_SELECTION_TIMEOUT_MS,
    });
    registerConnectionListeners();
    logger.info('Conexión a MongoDB establecida');
  } catch (error) {
    // El llamador (server.js) decide qué hacer: una falla inicial es fatal.
    throw new Error(`No se pudo conectar a MongoDB: ${error.message}`, { cause: error });
  }
};

module.exports = connectDB;
