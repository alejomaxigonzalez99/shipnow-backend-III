const path = require('path');
const { NODE_ENVS, LOG_LEVELS, LOG_LEVEL_BY_ENV } = require('../constants');

const nodeEnvFromProcess = process.env.NODE_ENV || 'development';
const envFile = nodeEnvFromProcess === 'test' ? '.env.test' : '.env';
require('dotenv').config({ path: path.resolve(process.cwd(), envFile) });

const REQUIRED_VARS = ['PORT', 'MONGODB_URI', 'NODE_ENV'];
const missing = REQUIRED_VARS.filter((key) => !process.env[key] || !process.env[key].trim());
if (missing.length) {
  throw new Error(`[env.config] Faltan variables obligatorias: ${missing.join(', ')}. Revisá el archivo de entorno.`);
}

const PORT = Number(process.env.PORT);
if (!Number.isInteger(PORT) || PORT < 1 || PORT > 65535) {
  throw new Error(`[env.config] PORT inválido: "${process.env.PORT}". Debe ser un entero entre 1 y 65535.`);
}
const NODE_ENV = process.env.NODE_ENV.trim();
if (!Object.values(NODE_ENVS).includes(NODE_ENV)) {
  throw new Error(`[env.config] NODE_ENV inválido. Valores permitidos: ${Object.values(NODE_ENVS).join(', ')}.`);
}
const LOG_LEVEL = (process.env.LOG_LEVEL || LOG_LEVEL_BY_ENV[NODE_ENV]).toLowerCase();
if (!Object.prototype.hasOwnProperty.call(LOG_LEVELS, LOG_LEVEL)) {
  throw new Error(`[env.config] LOG_LEVEL inválido: "${LOG_LEVEL}". Valores permitidos: ${Object.keys(LOG_LEVELS).join(', ')}.`);
}
const SERVICE_BASE_URLS = Object.freeze({
  TRACKING: process.env.TRACKING_SERVICE_URL || '',
  NOTIFICATIONS: process.env.NOTIFICATIONS_SERVICE_URL || '',
});
for (const [name, value] of Object.entries(SERVICE_BASE_URLS)) {
  if (!value) continue;
  try { new URL(value); } catch { throw new Error(`[env.config] ${name}_SERVICE_URL debe ser una URL válida.`); }
}

module.exports = Object.freeze({
  PORT,
  MONGODB_URI: process.env.MONGODB_URI.trim(),
  NODE_ENV,
  LOG_LEVEL,
  SERVICE_BASE_URLS,
  IS_PRODUCTION: NODE_ENV === NODE_ENVS.PRODUCTION,
});
