const bcrypt = require('bcryptjs');
const { fakerES: faker } = require('@faker-js/faker');
const config = require('../config/env.config');
const logger = require('../config/logger.config');
const UserRepository = require('../repositories/user.repository');
const OrderRepository = require('../repositories/order.repository');
const DeliveryRepository = require('../repositories/delivery.repository');
const { InvalidMockQtyError, MockSeedForbiddenError, MockSeedError } = require('../errors');
const { newObjectId } = require('../utils/object-id');
const {
  USER_ROLES,
  ORDER_STATUS,
  ORDER_PRIORITY,
  DELIVERY_STATUS,
  MOCK_LIMITS,
  MOCK_QTY_REASONS,
  MOCK_COLLECTIONS,
} = require('../constants');

const MOCK_PASSWORD = 'Test1234!';
const SALT_ROUNDS = 10;

// Estado de la entrega que corresponde a cada estado de pedido.
// Pedidos PENDING / CANCELLED no generan entrega.
const DELIVERY_STATUSES_BY_ORDER_STATUS = Object.freeze({
  [ORDER_STATUS.CONFIRMED]: [DELIVERY_STATUS.PENDING, DELIVERY_STATUS.ASSIGNED],
  [ORDER_STATUS.IN_TRANSIT]: [DELIVERY_STATUS.IN_TRANSIT],
  [ORDER_STATUS.DELIVERED]: [DELIVERY_STATUS.DELIVERED],
});

// Estados de entrega que exigen un repartidor asignado.
const DELIVERY_STATUSES_WITH_COURIER = Object.freeze([
  DELIVERY_STATUS.ASSIGNED,
  DELIVERY_STATUS.IN_TRANSIT,
  DELIVERY_STATUS.DELIVERED,
]);

// ---------- Generadores puros (no tocan la base) ----------

const buildMockUser = (role) => {
  const firstName = faker.person.firstName();
  const lastName = faker.person.lastName();
  const slug = `${firstName}.${lastName}`
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z.]/g, '')
    .toLowerCase();

  return {
    _id: newObjectId(),
    name: `${firstName} ${lastName}`,
    email: `${slug}.${faker.string.alphanumeric({ length: 5, casing: 'lower' })}@test.com`,
    role,
  };
};

const randomUserRole = () =>
  faker.helpers.weightedArrayElement([
    { value: USER_ROLES.CUSTOMER, weight: 6 },
    { value: USER_ROLES.COURIER, weight: 3 },
    { value: USER_ROLES.ADMIN, weight: 1 },
  ]);

const buildMockOrder = (customer) => {
  const items = Array.from({ length: faker.number.int({ min: 1, max: 4 }) }, () => ({
    name: faker.commerce.productName(),
    quantity: faker.number.int({ min: 1, max: 5 }),
    unitPrice: faker.number.int({ min: 500, max: 50000 }),
  }));
  const total = items.reduce((acc, i) => acc + i.quantity * i.unitPrice, 0);

  return {
    _id: newObjectId(),
    user: customer._id,
    items,
    total,
    status: faker.helpers.arrayElement(Object.values(ORDER_STATUS)),
    priority: faker.helpers.arrayElement(Object.values(ORDER_PRIORITY)),
    shippingAddress: `${faker.location.streetAddress()}, ${faker.location.city()}`,
  };
};

const buildMockDelivery = (order, couriers) => {
  const status = faker.helpers.arrayElement(DELIVERY_STATUSES_BY_ORDER_STATUS[order.status]);
  const needsCourier = DELIVERY_STATUSES_WITH_COURIER.includes(status);
  const isDelivered = status === DELIVERY_STATUS.DELIVERED;

  return {
    _id: newObjectId(),
    order: order._id,
    courier: needsCourier ? faker.helpers.arrayElement(couriers)._id : null,
    status,
    estimatedAt: faker.date.soon({ days: 5 }),
    deliveredAt: isDelivered ? faker.date.recent({ days: 5 }) : null,
  };
};

// ---------- Servicio ----------

class MockService {
  // Valida qty (viene de req.query: puede ser string, array, undefined...).
  static parseQty(rawQty) {
    if (rawQty === undefined) return MOCK_LIMITS.DEFAULT_QTY;

    const limits = { min: MOCK_LIMITS.MIN_QTY, max: MOCK_LIMITS.MAX_QTY };
    const fail = (reason) => {
      throw new InvalidMockQtyError(reason, rawQty, limits);
    };

    if (typeof rawQty !== 'string' || rawQty.trim() === '') fail(MOCK_QTY_REASONS.NOT_A_NUMBER);
    const qty = Number(rawQty);
    if (!Number.isFinite(qty)) fail(MOCK_QTY_REASONS.NOT_A_NUMBER);
    if (!Number.isInteger(qty)) fail(MOCK_QTY_REASONS.NOT_INTEGER);
    if (qty < 0) fail(MOCK_QTY_REASONS.NEGATIVE);
    if (qty < limits.min || qty > limits.max) fail(MOCK_QTY_REASONS.OUT_OF_RANGE);
    return qty;
  }

  static generateUsers(rawQty) {
    const qty = MockService.parseQty(rawQty);
    logger.debug(`Generando ${qty} usuarios mock (sin guardar)`);
    return Array.from({ length: qty }, () => buildMockUser(randomUserRole()));
  }

  static generateCouriers(rawQty) {
    const qty = MockService.parseQty(rawQty);
    logger.debug(`Generando ${qty} repartidores mock (sin guardar)`);
    return Array.from({ length: qty }, () => buildMockUser(USER_ROLES.COURIER));
  }

  // Dataset coherente: qty clientes, ceil(qty/3) repartidores, qty pedidos
  // (cada uno de un cliente) y una entrega por cada pedido que corresponda.
  static generateDataset(rawQty) {
    const qty = MockService.parseQty(rawQty);
    logger.debug(`Generando dataset mock (qty=${qty}, sin guardar)`);
    const customers = Array.from({ length: qty }, () => buildMockUser(USER_ROLES.CUSTOMER));
    const couriers = Array.from({ length: Math.ceil(qty / 3) }, () =>
      buildMockUser(USER_ROLES.COURIER)
    );
    const orders = Array.from({ length: qty }, () =>
      buildMockOrder(faker.helpers.arrayElement(customers))
    );
    const deliveries = orders
      .filter((o) => DELIVERY_STATUSES_BY_ORDER_STATUS[o.status])
      .map((o) => buildMockDelivery(o, couriers));

    return { users: [...customers, ...couriers], orders, deliveries };
  }

  static generateOrders(rawQty) {
    return MockService.generateDataset(rawQty).orders;
  }

  static generateDeliveries(rawQty) {
    return MockService.generateDataset(rawQty).deliveries;
  }

  // ---------- Carga a MongoDB ----------

  static assertSeedAllowed() {
    if (config.IS_PRODUCTION) {
      logger.warning('Intento de cargar datos de prueba en producción: bloqueado');
      throw new MockSeedForbiddenError();
    }
  }

  static async withPassword(users) {
    const password = await bcrypt.hash(MOCK_PASSWORD, SALT_ROUNDS);
    return users.map((u) => ({ ...u, password }));
  }

  // Borra (mejor esfuerzo) lo que se intentó insertar. Devuelve true si todo se pudo revertir.
  static async rollback(attempted) {
    const results = await Promise.allSettled(
      attempted.map(({ repository, ids }) => repository.deleteManyByIds(ids))
    );
    const ok = results.every((r) => r.status === 'fulfilled');
    if (ok) logger.warning('Seed fallido: se revirtieron los registros insertados');
    else logger.error('Seed fallido: NO se pudo revertir completamente la inserción (pueden quedar datos huérfanos)');
    return ok;
  }

  // Inserta por etapas (en orden de dependencias). Si una falla, revierte lo anterior
  // y lanza MockSeedError; la respuesta final la arma el middleware global.
  static async insertInOrder(stages) {
    const attempted = [];
    const counts = {};

    for (const { collection, repository, docs } of stages) {
      if (docs.length === 0) {
        counts[collection] = 0;
        continue;
      }
      attempted.push({ repository, ids: docs.map((d) => d._id) });
      try {
        const inserted = await repository.insertMany(docs);
        counts[collection] = inserted.length;
      } catch (error) {
        const rolledBack = await MockService.rollback(attempted);
        throw new MockSeedError({
          collection,
          rolledBack,
          reason: config.IS_PRODUCTION ? undefined : error.message,
          cause: error,
        });
      }
    }
    return counts;
  }

  static async seedUsers(rawQty) {
    MockService.assertSeedAllowed();
    const users = await MockService.withPassword(MockService.generateUsers(rawQty));
    const counts = await MockService.insertInOrder([
      { collection: MOCK_COLLECTIONS.USERS, repository: UserRepository, docs: users },
    ]);
    logger.info(`Seed de usuarios: ${counts[MOCK_COLLECTIONS.USERS]} insertados en "${MOCK_COLLECTIONS.USERS}"`);
    return { insertados: counts[MOCK_COLLECTIONS.USERS], coleccion: MOCK_COLLECTIONS.USERS };
  }

  static async seedAll(rawQty) {
    MockService.assertSeedAllowed();
    const dataset = MockService.generateDataset(rawQty);
    const users = await MockService.withPassword(dataset.users);

    // Orden por dependencias: usuarios -> pedidos -> entregas.
    const colecciones = await MockService.insertInOrder([
      { collection: MOCK_COLLECTIONS.USERS, repository: UserRepository, docs: users },
      { collection: MOCK_COLLECTIONS.ORDERS, repository: OrderRepository, docs: dataset.orders },
      { collection: MOCK_COLLECTIONS.DELIVERIES, repository: DeliveryRepository, docs: dataset.deliveries },
    ]);
    const insertados = Object.values(colecciones).reduce((a, b) => a + b, 0);
    logger.info(`Seed completo: ${insertados} registros insertados ${JSON.stringify(colecciones)}`);
    return { insertados, colecciones, passwordDePrueba: MOCK_PASSWORD };
  }
}

module.exports = MockService;
