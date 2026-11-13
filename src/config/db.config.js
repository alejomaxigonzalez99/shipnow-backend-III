const mongoose = require('mongoose');
const config = require('./env.config');

const connectDB = async () => {
  try {
    await mongoose.connect(config.MONGODB_URI);
    console.log('[db] Conectado a MongoDB');
  } catch (error) {
    throw new Error(`[db] No se pudo conectar a MongoDB: ${error.message}`);
  }
};

module.exports = connectDB;
