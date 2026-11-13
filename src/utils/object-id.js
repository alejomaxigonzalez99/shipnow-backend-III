const crypto = require('crypto');

// Genera un identificador hexadecimal de 24 caracteres compatible con MongoDB.
const newObjectId = () => crypto.randomBytes(12).toString('hex');

module.exports = { newObjectId };