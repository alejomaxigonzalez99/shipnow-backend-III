const { ERROR_CODES } = require('../../errors');
const {
  USER_ROLES,
  PRODUCT_STATUS,
  ORDER_STATUS,
  ORDER_PRIORITY,
  DELIVERY_STATUS,
  MOCK_QTY_REASONS,
  LOG_LEVELS,
} = require('../../constants');
const { ref } = require('../helpers');

const OBJECT_ID_EXAMPLE = '64b0f6f5a1b2c3d4e5f60718';

const objectId = (description) => ({
  type: 'string',
  pattern: '^[a-fA-F0-9]{24}$',
  description: description || 'ObjectId de MongoDB (24 caracteres hexadecimales)',
  example: OBJECT_ID_EXAMPLE,
});

const timestamps = {
  createdAt: { type: 'string', format: 'date-time' },
  updatedAt: { type: 'string', format: 'date-time' },
};

const schemas = {
  // ---------- Respuestas genéricas ----------
  SuccessResponse: {
    type: 'object',
    description: 'Envoltorio de las respuestas exitosas de Users, Products, Orders, Deliveries y Logger.',
    required: ['status'],
    properties: {
      status: { type: 'string', enum: ['success'] },
      payload: { description: 'Datos devueltos (su tipo depende del endpoint)' },
      message: { type: 'string', description: 'Mensaje informativo (por ejemplo al eliminar un recurso)' },
    },
  },
  ErrorResponse: {
    type: 'object',
    description: 'Estructura única de todos los errores de la API (la arma el middleware global de errores).',
    required: ['status', 'statusCode', 'error', 'path', 'timestamp'],
    properties: {
      status: { type: 'string', enum: ['error'] },
      statusCode: { type: 'integer', example: 400 },
      error: {
        type: 'object',
        required: ['code', 'message'],
        properties: {
          code: { type: 'string', enum: Object.values(ERROR_CODES), description: 'Identificador estable del error' },
          message: { type: 'string', description: 'Texto legible' },
          details: {
            type: 'object',
            description: 'Datos extra, solo cuando aplican. Se omite en errores 5xx en producción.',
            additionalProperties: true,
          },
        },
      },
      path: { type: 'string', example: '/api/mocks/users?qty=-5' },
      timestamp: { type: 'string', format: 'date-time' },
    },
  },

  // ---------- Users ----------
  User: {
    type: 'object',
    required: ['_id', 'name', 'email', 'role'],
    properties: {
      _id: objectId(),
      name: { type: 'string', example: 'Ana Pérez' },
      email: { type: 'string', format: 'email', example: 'ana.perez@test.com' },
      role: { type: 'string', enum: Object.values(USER_ROLES), example: USER_ROLES.CUSTOMER },
      ...timestamps,
    },
  },
  UserCreate: {
    type: 'object',
    required: ['name', 'email', 'password'],
    properties: {
      name: { type: 'string', example: 'Ana Pérez' },
      email: { type: 'string', format: 'email', example: 'ana.perez@test.com' },
      password: { type: 'string', format: 'password', example: 'Secreta123' },
      role: { type: 'string', enum: Object.values(USER_ROLES), default: USER_ROLES.CUSTOMER },
    },
  },
  UserUpdate: {
    type: 'object',
    description: 'Todos los campos son opcionales; solo se modifican los enviados.',
    properties: {
      name: { type: 'string' },
      email: { type: 'string', format: 'email' },
      password: { type: 'string', format: 'password' },
      role: { type: 'string', enum: Object.values(USER_ROLES) },
    },
  },

  // ---------- Products ----------
  Product: {
    type: 'object',
    required: ['_id', 'name', 'price', 'stock', 'status'],
    properties: {
      _id: objectId(),
      name: { type: 'string', example: 'Auriculares Bluetooth' },
      description: { type: 'string', example: 'Cancelación de ruido' },
      price: { type: 'number', minimum: 0, example: 15000 },
      stock: { type: 'integer', minimum: 0, example: 12 },
      status: { type: 'string', enum: Object.values(PRODUCT_STATUS) },
      ...timestamps,
    },
  },
  ProductCreate: {
    type: 'object',
    required: ['name', 'price'],
    properties: {
      name: { type: 'string', example: 'Auriculares Bluetooth' },
      description: { type: 'string' },
      price: { type: 'number', minimum: 0, example: 15000 },
      stock: { type: 'integer', minimum: 0, default: 0 },
    },
  },
  ProductUpdate: {
    type: 'object',
    description:
      'Campos opcionales. Si no se envía `status`, se recalcula según el stock (`AVAILABLE` / `OUT_OF_STOCK`).',
    properties: {
      name: { type: 'string' },
      description: { type: 'string' },
      price: { type: 'number', minimum: 0 },
      stock: { type: 'integer', minimum: 0 },
      status: { type: 'string', enum: Object.values(PRODUCT_STATUS) },
    },
  },

  // ---------- Orders ----------
  OrderItem: {
    type: 'object',
    required: ['name', 'quantity', 'unitPrice'],
    properties: {
      name: { type: 'string', example: 'Auriculares Bluetooth' },
      quantity: { type: 'integer', minimum: 1, example: 2 },
      unitPrice: { type: 'number', minimum: 0, example: 15000 },
    },
  },
  Order: {
    type: 'object',
    required: ['_id', 'user', 'items', 'total', 'status', 'priority', 'shippingAddress'],
    properties: {
      _id: objectId(),
      user: objectId('ID del usuario (rol CUSTOMER) dueño del pedido'),
      items: { type: 'array', items: ref('OrderItem') },
      total: { type: 'number', description: 'Suma de quantity × unitPrice', example: 30000 },
      status: { type: 'string', enum: Object.values(ORDER_STATUS), example: ORDER_STATUS.PENDING },
      priority: { type: 'string', enum: Object.values(ORDER_PRIORITY), example: ORDER_PRIORITY.NORMAL },
      shippingAddress: { type: 'string', example: 'Av. Siempre Viva 742, Springfield' },
      ...timestamps,
    },
  },
  OrderCreate: {
    type: 'object',
    required: ['user', 'items', 'shippingAddress'],
    description: 'El `total` se calcula en el servidor y el pedido nace en estado `PENDING`.',
    properties: {
      user: objectId('ID de un usuario existente'),
      items: { type: 'array', minItems: 1, items: ref('OrderItem') },
      shippingAddress: { type: 'string', example: 'Av. Siempre Viva 742, Springfield' },
      priority: { type: 'string', enum: Object.values(ORDER_PRIORITY), default: ORDER_PRIORITY.NORMAL },
    },
  },
  OrderStatusUpdate: {
    type: 'object',
    required: ['status'],
    properties: { status: { type: 'string', enum: Object.values(ORDER_STATUS), example: ORDER_STATUS.CONFIRMED } },
  },

  // ---------- Deliveries ----------
  Delivery: {
    type: 'object',
    required: ['_id', 'order', 'status'],
    properties: {
      _id: objectId(),
      order: objectId('ID del pedido asociado'),
      courier: {
        ...objectId('ID del repartidor (usuario con rol COURIER). `null` mientras no se asigna.'),
        nullable: true,
      },
      status: { type: 'string', enum: Object.values(DELIVERY_STATUS), example: DELIVERY_STATUS.PENDING },
      estimatedAt: { type: 'string', format: 'date-time' },
      deliveredAt: { type: 'string', format: 'date-time', nullable: true },
      ...timestamps,
    },
  },
  DeliveryStatusUpdate: {
    type: 'object',
    required: ['status'],
    properties: { status: { type: 'string', enum: Object.values(DELIVERY_STATUS), example: DELIVERY_STATUS.IN_TRANSIT } },
  },
  DeliveryCourierAssign: {
    type: 'object',
    required: ['courier'],
    properties: { courier: objectId('ID de un usuario existente con rol COURIER') },
  },

  // ---------- Mocks ----------
  MockDataset: {
    type: 'object',
    description: 'Conjunto coherente de datos simulados (no se guarda en la base).',
    required: ['users', 'orders', 'deliveries'],
    properties: {
      users: { type: 'array', items: ref('User'), description: 'qty clientes + ceil(qty/3) repartidores' },
      orders: { type: 'array', items: ref('Order'), description: 'qty pedidos, cada uno de un cliente' },
      deliveries: {
        type: 'array',
        items: ref('Delivery'),
        description: 'Una por cada pedido CONFIRMED, IN_TRANSIT o DELIVERED',
      },
    },
  },
  SeedUsersResult: {
    type: 'object',
    required: ['insertados', 'coleccion'],
    properties: {
      insertados: { type: 'integer', example: 10 },
      coleccion: { type: 'string', example: 'usuarios' },
    },
  },
  SeedAllResult: {
    type: 'object',
    required: ['insertados', 'colecciones', 'passwordDePrueba'],
    properties: {
      insertados: { type: 'integer', description: 'Total de registros insertados', example: 27 },
      colecciones: {
        type: 'object',
        properties: {
          usuarios: { type: 'integer', example: 14 },
          pedidos: { type: 'integer', example: 10 },
          entregas: { type: 'integer', example: 3 },
        },
      },
      passwordDePrueba: { type: 'string', example: 'Test1234!' },
    },
  },
  MockQtyErrorDetails: {
    type: 'object',
    description: '`error.details` cuando el código es MOCK_QTY_INVALID.',
    properties: {
      reason: { type: 'string', enum: Object.values(MOCK_QTY_REASONS) },
      received: { description: 'Valor recibido (string, o arreglo si qty se repite)' },
      min: { type: 'integer', example: 1 },
      max: { type: 'integer', example: 100 },
    },
  },

  // ---------- Logger ----------
  LoggerTestResult: {
    type: 'object',
    required: ['nivelMinimoActivo', 'niveles', 'carpetaDeLogs'],
    properties: {
      nivelMinimoActivo: { type: 'string', enum: Object.keys(LOG_LEVELS), example: 'debug' },
      niveles: {
        type: 'array',
        items: {
          type: 'object',
          required: ['nivel', 'registrado', 'archivoDeErrores'],
          properties: {
            nivel: { type: 'string', enum: Object.keys(LOG_LEVELS) },
            registrado: { type: 'boolean', description: 'Si el nivel está activo en el entorno actual' },
            archivoDeErrores: { type: 'boolean', description: 'Si ese nivel se guarda también en error-*.log' },
          },
        },
      },
      carpetaDeLogs: { type: 'string', example: '/ruta/al/proyecto/logs' },
    },
  },
};

module.exports = { schemas, OBJECT_ID_EXAMPLE };
