const PRODUCT_STATUS = Object.freeze({
  AVAILABLE: 'AVAILABLE',
  OUT_OF_STOCK: 'OUT_OF_STOCK',
  DISCONTINUED: 'DISCONTINUED',
});

const USER_ROLES = Object.freeze({
  ADMIN: 'ADMIN',
  CUSTOMER: 'CUSTOMER',
  COURIER: 'COURIER',
});

const ORDER_STATUS = Object.freeze({
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  IN_TRANSIT: 'IN_TRANSIT',
  DELIVERED: 'DELIVERED',
  CANCELLED: 'CANCELLED',
});

const ORDER_PRIORITY = Object.freeze({
  LOW: 'LOW',
  NORMAL: 'NORMAL',
  HIGH: 'HIGH',
  URGENT: 'URGENT',
});

// Transiciones permitidas del estado de un pedido.
const ORDER_STATUS_TRANSITIONS = Object.freeze({
  [ORDER_STATUS.PENDING]: [ORDER_STATUS.CONFIRMED, ORDER_STATUS.CANCELLED],
  [ORDER_STATUS.CONFIRMED]: [ORDER_STATUS.IN_TRANSIT, ORDER_STATUS.CANCELLED],
  [ORDER_STATUS.IN_TRANSIT]: [ORDER_STATUS.DELIVERED],
  [ORDER_STATUS.DELIVERED]: [],
  [ORDER_STATUS.CANCELLED]: [],
});

const DELIVERY_STATUS = Object.freeze({
  PENDING: 'PENDING',
  ASSIGNED: 'ASSIGNED',
  IN_TRANSIT: 'IN_TRANSIT',
  DELIVERED: 'DELIVERED',
  FAILED: 'FAILED',
});

// Transiciones permitidas del estado de una entrega.
const DELIVERY_STATUS_TRANSITIONS = Object.freeze({
  [DELIVERY_STATUS.PENDING]: [DELIVERY_STATUS.ASSIGNED, DELIVERY_STATUS.FAILED],
  [DELIVERY_STATUS.ASSIGNED]: [DELIVERY_STATUS.IN_TRANSIT, DELIVERY_STATUS.FAILED],
  [DELIVERY_STATUS.IN_TRANSIT]: [DELIVERY_STATUS.DELIVERED, DELIVERY_STATUS.FAILED],
  [DELIVERY_STATUS.DELIVERED]: [],
  [DELIVERY_STATUS.FAILED]: [],
});

// Estados de entrega que exigen un repartidor asignado.
const DELIVERY_STATUSES_REQUIRING_COURIER = Object.freeze([
  DELIVERY_STATUS.ASSIGNED,
  DELIVERY_STATUS.IN_TRANSIT,
  DELIVERY_STATUS.DELIVERED,
]);

const NODE_ENVS = Object.freeze({
  DEVELOPMENT: 'development',
  PRODUCTION: 'production',
  TEST: 'test',
});

const HTTP_STATUS = Object.freeze({
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  PAYLOAD_TOO_LARGE: 413,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
});

const MOCK_LIMITS = Object.freeze({
  DEFAULT_QTY: 10,
  MIN_QTY: 1,
  MAX_QTY: 100,
});

// Motivos por los que una qty puede ser inválida.
const MOCK_QTY_REASONS = Object.freeze({
  NOT_A_NUMBER: 'NOT_A_NUMBER',
  NOT_INTEGER: 'NOT_INTEGER',
  NEGATIVE: 'NEGATIVE',
  OUT_OF_RANGE: 'OUT_OF_RANGE',
});

// Niveles de log (menor número = más severo). `error` y `fatal` van al archivo de errores.
const LOG_LEVELS = Object.freeze({
  fatal: 0,
  error: 1,
  warning: 2,
  info: 3,
  http: 4,
  debug: 5,
});

const LOG_COLORS = Object.freeze({
  fatal: 'bold white redBG',
  error: 'red',
  warning: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue',
});

// Nivel mínimo que se registra según NODE_ENV.
const LOG_LEVEL_BY_ENV = Object.freeze({
  [NODE_ENVS.DEVELOPMENT]: 'debug',
  [NODE_ENVS.PRODUCTION]: 'info',
  [NODE_ENVS.TEST]: 'warning',
});

const LOG_CONFIG = Object.freeze({
  DIR_NAME: 'logs',
  ERROR_FILE: 'error-%DATE%.log',
  COMBINED_FILE: 'combined-%DATE%.log',
  DATE_PATTERN: 'YYYY-MM-DD',
  MAX_SIZE: '10m',
  MAX_FILES: '14d',
  TIMESTAMP_FORMAT: 'YYYY-MM-DD HH:mm:ss',
});

const USER_DOCUMENT_TYPES = Object.freeze({
  IDENTITY: 'IDENTITY',
  DRIVER_LICENSE: 'DRIVER_LICENSE',
  OTHER: 'OTHER',
});

const UPLOAD_CONFIG = Object.freeze({
  MAX_FILE_SIZE: 5 * 1024 * 1024,
  ALLOWED_MIME_TYPES: Object.freeze({
    'application/pdf': ['.pdf'],
    'image/jpeg': ['.jpg', '.jpeg'],
    'image/png': ['.png'],
    'image/webp': ['.webp'],
  }),
});

const MOCK_COLLECTIONS = Object.freeze({
  USERS: 'usuarios',
  ORDERS: 'pedidos',
  DELIVERIES: 'entregas',
});

module.exports = {
  PRODUCT_STATUS,
  USER_ROLES,
  ORDER_STATUS,
  ORDER_PRIORITY,
  ORDER_STATUS_TRANSITIONS,
  DELIVERY_STATUS,
  DELIVERY_STATUS_TRANSITIONS,
  DELIVERY_STATUSES_REQUIRING_COURIER,
  NODE_ENVS,
  HTTP_STATUS,
  LOG_LEVELS,
  LOG_COLORS,
  LOG_LEVEL_BY_ENV,
  LOG_CONFIG,
  MOCK_LIMITS,
  MOCK_QTY_REASONS,
  MOCK_COLLECTIONS,
  USER_DOCUMENT_TYPES,
  UPLOAD_CONFIG,
};
