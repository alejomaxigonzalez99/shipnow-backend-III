const {
  ref, paramRef, errorResponses, successResponse, jsonBody,
  INTERNAL, DB_DOWN, INVALID_JSON, INVALID_ID,
} = require('../helpers');
const { OBJECT_ID_EXAMPLE } = require('../components/schemas');
const { ORDER_STATUS, ORDER_PRIORITY, ORDER_STATUS_TRANSITIONS } = require('../../constants');

const TAG = 'Orders';
const orderExample = {
  _id: OBJECT_ID_EXAMPLE,
  user: '64a0f6f5a1b2c3d4e5f60001',
  items: [{ name: 'Auriculares Bluetooth', quantity: 2, unitPrice: 15000 }],
  total: 30000,
  status: 'PENDING',
  priority: 'NORMAL',
  shippingAddress: 'Av. Siempre Viva 742, Springfield',
  createdAt: '2026-11-14T15:00:00.000Z',
  updatedAt: '2026-11-14T15:00:00.000Z',
};
const notFound = { code: 'ORDER_NOT_FOUND', message: `Pedido no encontrado: ${OBJECT_ID_EXAMPLE}`, details: { id: OBJECT_ID_EXAMPLE } };
const invalidStatus = {
  code: 'INVALID_STATUS',
  message: 'Estado inválido para pedido: "XX". Permitidos: PENDING, CONFIRMED, IN_TRANSIT, DELIVERED, CANCELLED',
  details: { entity: 'pedido', received: 'XX', allowed: Object.values(ORDER_STATUS) },
};
const invalidTransition = {
  code: 'INVALID_STATUS_TRANSITION',
  message: 'No se puede pasar pedido de PENDING a DELIVERED',
  details: { entity: 'pedido', from: 'PENDING', to: 'DELIVERED', allowed: ORDER_STATUS_TRANSITIONS.PENDING },
};

const ordersPaths = {
  '/api/orders': {
    get: {
      tags: [TAG],
      summary: 'Listar pedidos',
      operationId: 'listOrders',
      parameters: [
        {
          name: 'status',
          in: 'query',
          required: false,
          description: 'Filtra por estado del pedido',
          schema: { type: 'string', enum: Object.values(ORDER_STATUS) },
        },
      ],
      responses: {
        200: successResponse('Lista de pedidos', { type: 'array', items: ref('Order') }, [orderExample]),
        ...errorResponses('/api/orders?status=XX', [invalidStatus, DB_DOWN, INTERNAL]),
      },
    },
    post: {
      tags: [TAG],
      summary: 'Crear pedido',
      description:
        `El usuario debe existir. El \`total\` se calcula en el servidor (suma de quantity × unitPrice) y el pedido se crea en estado \`${ORDER_STATUS.PENDING}\`. Prioridades: ${Object.values(ORDER_PRIORITY).join(', ')}.`,
      operationId: 'createOrder',
      requestBody: jsonBody('OrderCreate', {
        user: '64a0f6f5a1b2c3d4e5f60001',
        items: [{ name: 'Auriculares Bluetooth', quantity: 2, unitPrice: 15000 }],
        shippingAddress: 'Av. Siempre Viva 742, Springfield',
        priority: 'HIGH',
      }),
      responses: {
        201: successResponse('Pedido creado', ref('Order'), { ...orderExample, priority: 'HIGH' }),
        ...errorResponses('/api/orders', [
          { code: 'MISSING_FIELDS', details: { fields: ['shippingAddress'] } },
          {
            code: 'VALIDATION_ERROR',
            details: { fields: [{ field: 'items[0].quantity', message: 'Debe ser un entero mayor o igual a 1' }] },
          },
          INVALID_ID('abc'),
          INVALID_JSON,
          { code: 'USER_NOT_FOUND', message: 'Usuario no encontrado: 64a0f6f5a1b2c3d4e5f60001', details: { id: '64a0f6f5a1b2c3d4e5f60001' } },
          DB_DOWN,
          INTERNAL,
        ]),
      },
    },
  },
  '/api/orders/{id}': {
    get: {
      tags: [TAG],
      summary: 'Obtener un pedido por ID',
      operationId: 'getOrderById',
      parameters: [paramRef('Id')],
      responses: {
        200: successResponse('Pedido encontrado', ref('Order'), orderExample),
        ...errorResponses(`/api/orders/${OBJECT_ID_EXAMPLE}`, [INVALID_ID(), notFound, DB_DOWN, INTERNAL]),
      },
    },
  },
  '/api/orders/{id}/status': {
    patch: {
      tags: [TAG],
      summary: 'Cambiar el estado de un pedido',
      description:
        'Solo se permiten estas transiciones: ' +
        Object.entries(ORDER_STATUS_TRANSITIONS)
          .map(([from, to]) => `${from} → ${to.length ? to.join(' / ') : '(final)'}`)
          .join('; ') +
        '.',
      operationId: 'updateOrderStatus',
      parameters: [paramRef('Id')],
      requestBody: jsonBody('OrderStatusUpdate', { status: 'CONFIRMED' }),
      responses: {
        200: successResponse('Pedido actualizado', ref('Order'), { ...orderExample, status: 'CONFIRMED' }),
        ...errorResponses(`/api/orders/${OBJECT_ID_EXAMPLE}/status`, [
          INVALID_ID(), invalidStatus, INVALID_JSON, notFound, invalidTransition, DB_DOWN, INTERNAL,
        ]),
      },
    },
  },
};

module.exports = { ordersPaths };
