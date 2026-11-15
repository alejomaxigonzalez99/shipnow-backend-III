const path = require('path');

const envFile = process.env.NODE_ENV === 'test' ? '.env.test' : '.env';

require('dotenv').config({
  path: path.resolve(process.cwd(), envFile),
});

const { NODE_ENVS } = require('../constants');

const REQUIRED_VARS = ['PORT', 'MONGODB_URI', 'NODE_ENV'];

const missing = REQUIRED_VARS.filter((key) => {
  const value = process.env[key];
  return value === undefined || value.trim() === '';
});

if (missing.length > 0) {
  throw new Error(
    `[env.config] Faltan variables de entorno obligatorias: ${missing.join(', ')}. ` +
      'Copiá .env.example a .env y completá los valores.'
  );
}

const port = Number(process.env.PORT);
if (!Number.isInteger(port) || port <= 0 || port > 65535) {
  throw new Error(`[env.config] PORT inválido: "${process.env.PORT}". Debe ser un entero entre 1 y 65535.`);
}

const nodeEnv = process.env.NODE_ENV.trim();
if (!Object.values(NODE_ENVS).includes(nodeEnv)) {
  throw new Error(
    `[env.config] NODE_ENV inválido: "${nodeEnv}". Valores permitidos: ${Object.values(NODE_ENVS).join(', ')}.`
  );
}

const config = Object.freeze({
  PORT: port,
  MONGODB_URI: process.env.MONGODB_URI.trim(),
  NODE_ENV: nodeEnv,
  IS_PRODUCTION: nodeEnv === NODE_ENVS.PRODUCTION,
});

module.exports = config;
