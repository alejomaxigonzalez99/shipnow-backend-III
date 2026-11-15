const { ERROR_DICTIONARY } = require('../errors');

const ref = (name) => ({ $ref: `#/components/schemas/${name}` });
const paramRef = (name) => ({ $ref: `#/components/parameters/${name}` });

const EXAMPLE_TIMESTAMP = '2026-11-14T15:27:36.959Z';

// Descripción base por status HTTP para las respuestas de error.
const STATUS_DESCRIPTIONS = Object.freeze({
  400: 'Datos inválidos',
  403: 'Operación no permitida',
  404: 'Recurso no encontrado',
  409: 'Conflicto con el estado actual',
  500: 'Error interno del servidor',
  503: 'Base de datos no disponible',
});

const errorExample = ({ code, message, details, path }) => ({
  status: 'error',
  statusCode: ERROR_DICTIONARY[code].status,
  error: {
    code,
    message: message || ERROR_DICTIONARY[code].message,
    ...(details ? { details } : {}),
  },
  path,
  timestamp: EXAMPLE_TIMESTAMP,
});

/**
 * Arma el objeto `responses` de errores de una operación a partir de una lista
 * de casos { code, message?, details? }. El status HTTP sale del diccionario
 * de errores real, así la documentación no puede contradecir a la API.
 */
const errorResponses = (path, cases) => {
  const byStatus = {};
  cases.forEach((c) => {
    const status = ERROR_DICTIONARY[c.code].status;
    (byStatus[status] = byStatus[status] || []).push(c);
  });

  return Object.fromEntries(
    Object.entries(byStatus).map(([status, group]) => [
      status,
      {
        description: `${STATUS_DESCRIPTIONS[status]}. Códigos posibles: ${group.map((c) => c.code).join(', ')}`,
        content: {
          'application/json': {
            schema: ref('ErrorResponse'),
            examples: Object.fromEntries(
              group.map((c) => [c.code, { summary: c.code, value: errorExample({ ...c, path }) }])
            ),
          },
        },
      },
    ])
  );
};

// Respuesta exitosa: reutiliza SuccessResponse y concreta el tipo de `payload`.
const successResponse = (description, payloadSchema, example) => ({
  description,
  content: {
    'application/json': {
      schema: {
        allOf: [ref('SuccessResponse'), { type: 'object', properties: { payload: payloadSchema } }],
      },
      ...(example !== undefined ? { example: { status: 'success', payload: example } } : {}),
    },
  },
});

const messageResponse = (description, message) => ({
  description,
  content: {
    'application/json': {
      schema: ref('SuccessResponse'),
      example: { status: 'success', message },
    },
  },
});

// Casos de error que pueden ocurrir en cualquier operación.
const INTERNAL = { code: 'INTERNAL_ERROR' };
const DB_DOWN = { code: 'DATABASE_UNAVAILABLE' };
const INVALID_JSON = { code: 'INVALID_JSON' };
const INVALID_ID = (id = 'abc') => ({ code: 'INVALID_ID', details: { received: id } });

const jsonBody = (schemaName, example, description) => ({
  required: true,
  description,
  content: { 'application/json': { schema: ref(schemaName), example } },
});

module.exports = {
  ref,
  paramRef,
  errorResponses,
  successResponse,
  messageResponse,
  jsonBody,
  INTERNAL,
  DB_DOWN,
  INVALID_JSON,
  INVALID_ID,
};
