const { ref, paramRef, errorResponses } = require('../helpers');
const { OBJECT_ID_EXAMPLE } = require('../components/schemas');
const { MOCK_LIMITS } = require('../../constants');

const TAG = 'Mocks';
const qtyErrorCases = () => [
  { code: 'MOCK_QTY_INVALID', message: 'qty inválida (NEGATIVE): se recibió "-5". Debe ser un entero entre 1 y 100', details: { reason: 'NEGATIVE', received: '-5', min: MOCK_LIMITS.MIN_QTY, max: MOCK_LIMITS.MAX_QTY } },
];

const mockUser = { _id: OBJECT_ID_EXAMPLE, name: 'Ana Pérez', email: 'ana.perez.k3x9a@test.com', role: 'CUSTOMER' };
const mockOrder = {
  _id: '64b1f6f5a1b2c3d4e5f60abc',
  user: OBJECT_ID_EXAMPLE,
  items: [{ name: 'Mouse inalámbrico', quantity: 2, unitPrice: 4500 }],
  total: 9000,
  status: 'CONFIRMED',
  priority: 'HIGH',
  shippingAddress: 'Calle Mayor 12, Córdoba',
};
const mockDelivery = {
  _id: '64c1f6f5a1b2c3d4e5f60def',
  order: '64b1f6f5a1b2c3d4e5f60abc',
  courier: null,
  status: 'PENDING',
  estimatedAt: '2026-11-16T12:00:00.000Z',
  deliveredAt: null,
};

const getOp = (summary, description, operationId, itemSchema, example, path) => ({
  tags: [TAG],
  summary,
  description: `${description} **No guarda nada en la base de datos.** Devuelve el arreglo directamente (sin el envoltorio \`status/payload\`).`,
  operationId,
  parameters: [paramRef('Qty')],
  responses: {
    200: {
      description: 'Datos simulados',
      content: { 'application/json': { schema: { type: 'array', items: itemSchema }, example: [example] } },
    },
    ...errorResponses(path, qtyErrorCases()),
  },
});

const seedErrors = (path) => [
  { code: 'MOCK_QTY_INVALID', message: 'qty inválida (OUT_OF_RANGE): se recibió "0". Debe ser un entero entre 1 y 100', details: { reason: 'OUT_OF_RANGE', received: '0', min: MOCK_LIMITS.MIN_QTY, max: MOCK_LIMITS.MAX_QTY } },
  { code: 'MOCK_SEED_FORBIDDEN' },
  {
    code: 'MOCK_SEED_FAILED',
    message: 'Falló la inserción en la colección "pedidos"',
    details: { collection: 'pedidos', rolledBack: true, reason: 'E11000 duplicate key error' },
  },
];

const mocksPaths = {
  '/api/mocks/users': {
    get: getOp('Generar usuarios simulados', 'Genera `qty` usuarios con roles válidos (`ADMIN`, `CUSTOMER`, `COURIER`).', 'getMockUsers', ref('User'), mockUser, '/api/mocks/users?qty=-5'),
  },
  '/api/mocks/couriers': {
    get: getOp('Generar repartidores simulados', 'Genera `qty` usuarios con rol `COURIER`.', 'getMockCouriers', ref('User'), { ...mockUser, role: 'COURIER' }, '/api/mocks/couriers?qty=-5'),
  },
  '/api/mocks/orders': {
    get: getOp('Generar pedidos simulados', 'Genera `qty` pedidos con estados y prioridades válidos, vinculados a clientes simulados.', 'getMockOrders', ref('Order'), mockOrder, '/api/mocks/orders?qty=-5'),
  },
  '/api/mocks/deliveries': {
    get: getOp('Generar entregas simuladas', 'Genera entregas asociadas a pedidos simulados (solo pedidos `CONFIRMED`, `IN_TRANSIT` o `DELIVERED`). Las entregas asignadas, en tránsito o entregadas llevan repartidor (`COURIER`). Pueden resultar menos de `qty`.', 'getMockDeliveries', ref('Delivery'), mockDelivery, '/api/mocks/deliveries?qty=-5'),
  },
  '/api/mocks/dataset': {
    get: {
      tags: [TAG],
      summary: 'Generar un conjunto de datos relacionado',
      description:
        'Genera usuarios, pedidos y entregas relacionados entre sí (`order.user` → usuario, `delivery.order` → pedido, `delivery.courier` → repartidor). **No guarda nada en la base de datos.**',
      operationId: 'getMockDataset',
      parameters: [paramRef('Qty')],
      responses: {
        200: {
          description: 'Dataset simulado',
          content: {
            'application/json': {
              schema: ref('MockDataset'),
              example: { users: [mockUser], orders: [mockOrder], deliveries: [mockDelivery] },
            },
          },
        },
        ...errorResponses('/api/mocks/dataset?qty=-5', qtyErrorCases()),
      },
    },
  },
  '/api/mocks/seed/users': {
    post: {
      tags: [TAG],
      summary: 'Insertar usuarios de prueba en MongoDB',
      description:
        'Inserta `qty` usuarios simulados. **No lleva body**: la cantidad se envía por query string. Todos comparten el password `Test1234!` (guardado con hash). Deshabilitado con `NODE_ENV=production` (en ese caso se responde 403 antes de validar `qty`).',
      operationId: 'seedMockUsers',
      parameters: [paramRef('Qty')],
      responses: {
        201: {
          description: 'Usuarios insertados',
          content: { 'application/json': { schema: ref('SeedUsersResult'), example: { insertados: 10, coleccion: 'usuarios' } } },
        },
        ...errorResponses('/api/mocks/seed/users?qty=0', seedErrors()),
      },
    },
  },
  '/api/mocks/seed': {
    post: {
      tags: [TAG],
      summary: 'Insertar un conjunto de datos de prueba relacionado en MongoDB',
      description:
        'Inserta `qty` clientes, `ceil(qty/3)` repartidores, `qty` pedidos y las entregas que correspondan, en orden de dependencias (usuarios → pedidos → entregas). **No lleva body**: la cantidad se envía por query string. Si una etapa falla se revierte lo ya insertado y se responde `MOCK_SEED_FAILED` (`details.rolledBack` indica si el rollback funcionó). Deshabilitado con `NODE_ENV=production`.',
      operationId: 'seedMockDataset',
      parameters: [paramRef('Qty')],
      responses: {
        201: {
          description: 'Datos insertados',
          content: {
            'application/json': {
              schema: ref('SeedAllResult'),
              example: { insertados: 27, colecciones: { usuarios: 14, pedidos: 10, entregas: 3 }, passwordDePrueba: 'Test1234!' },
            },
          },
        },
        ...errorResponses('/api/mocks/seed?qty=0', seedErrors()),
      },
    },
  },
};

module.exports = { mocksPaths };
