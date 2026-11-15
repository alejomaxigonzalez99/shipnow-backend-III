const { MOCK_LIMITS } = require('../../constants');
const { OBJECT_ID_EXAMPLE } = require('./schemas');

const parameters = {
  Id: {
    name: 'id',
    in: 'path',
    required: true,
    description: 'ObjectId de MongoDB del recurso',
    schema: { type: 'string', pattern: '^[a-fA-F0-9]{24}$', example: OBJECT_ID_EXAMPLE },
  },
  Qty: {
    name: 'qty',
    in: 'query',
    required: false,
    description: `Cantidad de datos a generar (entero entre ${MOCK_LIMITS.MIN_QTY} y ${MOCK_LIMITS.MAX_QTY}). Si se omite, ${MOCK_LIMITS.DEFAULT_QTY}. Se valida como texto: valores negativos, decimales, no numéricos, vacíos o repetidos se rechazan con MOCK_QTY_INVALID.`,
    schema: {
      type: 'integer',
      minimum: MOCK_LIMITS.MIN_QTY,
      maximum: MOCK_LIMITS.MAX_QTY,
      default: MOCK_LIMITS.DEFAULT_QTY,
    },
  },
};

module.exports = { parameters };
