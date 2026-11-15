const {
  ref, paramRef, errorResponses, successResponse, jsonBody,
  INTERNAL, DB_DOWN, INVALID_JSON, INVALID_ID,
} = require('../helpers');
const { OBJECT_ID_EXAMPLE } = require('../components/schemas');
const { DELIVERY_STATUS, DELIVERY_STATUS_TRANSITIONS, DELIVERY_STATUSES_REQUIRING_COURIER } = require('../../constants');

const TAG = 'Deliveries';
const COURIER_ID = '64c0f6f5a1b2c3d4e5f60099';
const deliveryExample = {
  _id: OBJECT_ID_EXAMPLE,
  order: '64b1f6f5a1b2c3d4e5f60abc',
  courier: null,
  status: 'PENDING',
  estimatedAt: '2026-11-16T12:00:00.000Z',
  deliveredAt: null,
  createdAt: '2026-11-14T15:00:00.000Z',
  updatedAt: '2026-11-14T15:00:00.000Z',
};
const notFound = { code: 'DELIVERY_NOT_FOUND', message: `Entrega no encontrada: ${OBJECT_ID_EXAMPLE}`, details: { id: OBJECT_ID_EXAMPLE } };
const invalidStatus = {
  code: 'INVALID_STATUS',
  message: 'Estado inválido para entrega: "XX". Permitidos: PENDING, ASSIGNED, IN_TRANSIT, DELIVERED, FAILED',
  details: { entity: 'entrega', received: 'XX', allowed: Object.values(DELIVERY_STATUS) },
};

const transitionsText = Object.entries(DELIVERY_STATUS_TRANSITIONS)
  .map(([from, to]) => `${from} → ${to.length ? to.join(' / ') : '(final)'}`)
  .join('; ');

const deliveriesPaths = {
  '/api/deliveries': {
    get: {
      tags: [TAG],
      summary: 'Listar entregas',
      operationId: 'listDeliveries',
      parameters: [
        {
          name: 'status',
          in: 'query',
          required: false,
          description: 'Filtra por estado de la entrega',
          schema: { type: 'string', enum: Object.values(DELIVERY_STATUS) },
        },
      ],
      responses: {
        200: successResponse('Lista de entregas', { type: 'array', items: ref('Delivery') }, [deliveryExample]),
        ...errorResponses('/api/deliveries?status=XX', [invalidStatus, DB_DOWN, INTERNAL]),
      },
    },
  },
  '/api/deliveries/{id}': {
    get: {
      tags: [TAG],
      summary: 'Obtener una entrega por ID',
      operationId: 'getDeliveryById',
      parameters: [paramRef('Id')],
      responses: {
        200: successResponse('Entrega encontrada', ref('Delivery'), deliveryExample),
        ...errorResponses(`/api/deliveries/${OBJECT_ID_EXAMPLE}`, [INVALID_ID(), notFound, DB_DOWN, INTERNAL]),
      },
    },
  },
  '/api/deliveries/{id}/courier': {
    patch: {
      tags: [TAG],
      summary: 'Asignar repartidor a una entrega',
      description:
        'El usuario debe existir y tener rol `COURIER`. La entrega pasa a `ASSIGNED`. Solo se puede (re)asignar mientras la entrega está `PENDING` o `ASSIGNED`.',
      operationId: 'assignDeliveryCourier',
      parameters: [paramRef('Id')],
      requestBody: jsonBody('DeliveryCourierAssign', { courier: COURIER_ID }),
      responses: {
        200: successResponse('Entrega con repartidor asignado', ref('Delivery'), { ...deliveryExample, courier: COURIER_ID, status: 'ASSIGNED' }),
        ...errorResponses(`/api/deliveries/${OBJECT_ID_EXAMPLE}/courier`, [
          { code: 'MISSING_FIELDS', details: { fields: ['courier'] } },
          { code: 'INVALID_COURIER', message: `El usuario ${COURIER_ID} tiene rol CUSTOMER; debe tener rol COURIER`, details: { userId: COURIER_ID, role: 'CUSTOMER' } },
          INVALID_ID(),
          INVALID_JSON,
          notFound,
          { code: 'USER_NOT_FOUND', message: `Usuario no encontrado: ${COURIER_ID}`, details: { id: COURIER_ID } },
          {
            code: 'INVALID_STATUS_TRANSITION',
            message: 'No se puede pasar entrega de IN_TRANSIT a ASSIGNED',
            details: { entity: 'entrega', from: 'IN_TRANSIT', to: 'ASSIGNED', allowed: DELIVERY_STATUS_TRANSITIONS.IN_TRANSIT },
          },
          DB_DOWN,
          INTERNAL,
        ]),
      },
    },
  },
  '/api/deliveries/{id}/status': {
    patch: {
      tags: [TAG],
      summary: 'Cambiar el estado de una entrega',
      description:
        `Transiciones permitidas: ${transitionsText}. Los estados ${DELIVERY_STATUSES_REQUIRING_COURIER.join(', ')} exigen que la entrega ya tenga repartidor (ver \`PATCH /api/deliveries/{id}/courier\`). Al pasar a \`DELIVERED\` se completa \`deliveredAt\`.`,
      operationId: 'updateDeliveryStatus',
      parameters: [paramRef('Id')],
      requestBody: jsonBody('DeliveryStatusUpdate', { status: 'IN_TRANSIT' }),
      responses: {
        200: successResponse('Entrega actualizada', ref('Delivery'), { ...deliveryExample, courier: COURIER_ID, status: 'IN_TRANSIT' }),
        ...errorResponses(`/api/deliveries/${OBJECT_ID_EXAMPLE}/status`, [
          INVALID_ID(),
          invalidStatus,
          INVALID_JSON,
          notFound,
          {
            code: 'INVALID_STATUS_TRANSITION',
            message: 'No se puede pasar entrega de PENDING a DELIVERED',
            details: { entity: 'entrega', from: 'PENDING', to: 'DELIVERED', allowed: DELIVERY_STATUS_TRANSITIONS.PENDING },
          },
          {
            code: 'DELIVERY_COURIER_REQUIRED',
            message: `La entrega ${OBJECT_ID_EXAMPLE} no tiene repartidor: asignalo antes de pasarla a ASSIGNED`,
            details: { id: OBJECT_ID_EXAMPLE, status: 'ASSIGNED' },
          },
          DB_DOWN,
          INTERNAL,
        ]),
      },
    },
  },
};

module.exports = { deliveriesPaths };
