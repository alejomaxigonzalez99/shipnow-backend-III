const { HTTP_STATUS } = require('../constants');

// Códigos de error estables que consume el cliente.
const ERROR_CODES = Object.freeze({
  // Validación genérica
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  MISSING_FIELDS: 'MISSING_FIELDS',
  INVALID_ID: 'INVALID_ID',
  INVALID_JSON: 'INVALID_JSON',
  INVALID_ROLE: 'INVALID_ROLE',
  INVALID_STATUS: 'INVALID_STATUS',
  INVALID_STATUS_TRANSITION: 'INVALID_STATUS_TRANSITION',
  INVALID_COURIER: 'INVALID_COURIER',
  DELIVERY_COURIER_REQUIRED: 'DELIVERY_COURIER_REQUIRED',
  FILE_REQUIRED: 'FILE_REQUIRED',
  FILE_TYPE_INVALID: 'FILE_TYPE_INVALID',
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  FILE_FIELD_INVALID: 'FILE_FIELD_INVALID',
  DOCUMENT_TYPE_INVALID: 'DOCUMENT_TYPE_INVALID',
  FILE_UPLOAD_FAILED: 'FILE_UPLOAD_FAILED',
  // No encontrado
  ROUTE_NOT_FOUND: 'ROUTE_NOT_FOUND',
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  PRODUCT_NOT_FOUND: 'PRODUCT_NOT_FOUND',
  ORDER_NOT_FOUND: 'ORDER_NOT_FOUND',
  DELIVERY_NOT_FOUND: 'DELIVERY_NOT_FOUND',
  // Conflictos
  EMAIL_ALREADY_EXISTS: 'EMAIL_ALREADY_EXISTS',
  DUPLICATE_KEY: 'DUPLICATE_KEY',
  // Mocks
  MOCK_QTY_INVALID: 'MOCK_QTY_INVALID',
  MOCK_SEED_FORBIDDEN: 'MOCK_SEED_FORBIDDEN',
  MOCK_SEED_FAILED: 'MOCK_SEED_FAILED',
  // Infraestructura
  DATABASE_UNAVAILABLE: 'DATABASE_UNAVAILABLE',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
});

// Diccionario: código -> status HTTP + mensaje por defecto.
const ERROR_DICTIONARY = Object.freeze({
  [ERROR_CODES.VALIDATION_ERROR]: { status: HTTP_STATUS.BAD_REQUEST, message: 'Los datos enviados no son válidos' },
  [ERROR_CODES.MISSING_FIELDS]: { status: HTTP_STATUS.BAD_REQUEST, message: 'Faltan campos obligatorios' },
  [ERROR_CODES.INVALID_ID]: { status: HTTP_STATUS.BAD_REQUEST, message: 'El identificador no tiene un formato válido' },
  [ERROR_CODES.INVALID_JSON]: { status: HTTP_STATUS.BAD_REQUEST, message: 'El cuerpo de la petición no es un JSON válido' },
  [ERROR_CODES.INVALID_ROLE]: { status: HTTP_STATUS.BAD_REQUEST, message: 'El rol indicado no es válido' },
  [ERROR_CODES.INVALID_STATUS]: { status: HTTP_STATUS.BAD_REQUEST, message: 'El estado indicado no es válido' },
  [ERROR_CODES.INVALID_STATUS_TRANSITION]: { status: HTTP_STATUS.CONFLICT, message: 'La transición de estado no está permitida' },

  [ERROR_CODES.INVALID_COURIER]: { status: HTTP_STATUS.BAD_REQUEST, message: 'El usuario indicado no es un repartidor' },
  [ERROR_CODES.DELIVERY_COURIER_REQUIRED]: { status: HTTP_STATUS.CONFLICT, message: 'La entrega necesita un repartidor asignado para pasar a ese estado' },
  [ERROR_CODES.FILE_REQUIRED]: { status: HTTP_STATUS.BAD_REQUEST, message: 'Debe adjuntar un archivo en el campo file' },
  [ERROR_CODES.FILE_TYPE_INVALID]: { status: HTTP_STATUS.BAD_REQUEST, message: 'El tipo de archivo no está permitido' },
  [ERROR_CODES.FILE_TOO_LARGE]: { status: HTTP_STATUS.PAYLOAD_TOO_LARGE, message: 'El archivo supera el tamaño máximo permitido de 5 MB' },
  [ERROR_CODES.FILE_FIELD_INVALID]: { status: HTTP_STATUS.BAD_REQUEST, message: 'El campo de archivo debe llamarse file y se admite un único archivo' },
  [ERROR_CODES.DOCUMENT_TYPE_INVALID]: { status: HTTP_STATUS.BAD_REQUEST, message: 'El tipo de documento no es válido' },
  [ERROR_CODES.FILE_UPLOAD_FAILED]: { status: HTTP_STATUS.INTERNAL_SERVER_ERROR, message: 'No se pudo guardar el archivo o asociarlo a la entidad' },

  [ERROR_CODES.ROUTE_NOT_FOUND]: { status: HTTP_STATUS.NOT_FOUND, message: 'Ruta no encontrada' },
  [ERROR_CODES.USER_NOT_FOUND]: { status: HTTP_STATUS.NOT_FOUND, message: 'Usuario no encontrado' },
  [ERROR_CODES.PRODUCT_NOT_FOUND]: { status: HTTP_STATUS.NOT_FOUND, message: 'Producto no encontrado' },
  [ERROR_CODES.ORDER_NOT_FOUND]: { status: HTTP_STATUS.NOT_FOUND, message: 'Pedido no encontrado' },
  [ERROR_CODES.DELIVERY_NOT_FOUND]: { status: HTTP_STATUS.NOT_FOUND, message: 'Entrega no encontrada' },

  [ERROR_CODES.EMAIL_ALREADY_EXISTS]: { status: HTTP_STATUS.CONFLICT, message: 'El email ya está registrado' },
  [ERROR_CODES.DUPLICATE_KEY]: { status: HTTP_STATUS.CONFLICT, message: 'Ya existe un registro con esos datos' },

  [ERROR_CODES.MOCK_QTY_INVALID]: { status: HTTP_STATUS.BAD_REQUEST, message: 'La cantidad (qty) solicitada no es válida' },
  [ERROR_CODES.MOCK_SEED_FORBIDDEN]: { status: HTTP_STATUS.FORBIDDEN, message: 'La carga de datos de prueba está deshabilitada en producción' },
  [ERROR_CODES.MOCK_SEED_FAILED]: { status: HTTP_STATUS.INTERNAL_SERVER_ERROR, message: 'Falló la carga de datos de prueba en la base de datos' },

  [ERROR_CODES.DATABASE_UNAVAILABLE]: { status: HTTP_STATUS.SERVICE_UNAVAILABLE, message: 'La base de datos no está disponible en este momento' },
  [ERROR_CODES.INTERNAL_ERROR]: { status: HTTP_STATUS.INTERNAL_SERVER_ERROR, message: 'Error interno del servidor' },
});

module.exports = { ERROR_CODES, ERROR_DICTIONARY };
