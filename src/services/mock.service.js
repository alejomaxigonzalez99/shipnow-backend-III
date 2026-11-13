const bcrypt = require('bcryptjs');
const { fakerES: faker } = require('@faker-js/faker');
const config = require('../config/env.config');
const UserRepository = require('../repositories/user.repository');
const OrderRepository = require('../repositories/order.repository');
const DeliveryRepository = require('../repositories/delivery.repository');
const AppError = require('../utils/app-error');
const { newObjectId } = require('../utils/object-id');
const {
  USER_ROLES,
  ORDER_STATUS,
  ORDER_PRIORITY,
  DELIVERY_STATUS,
  HTTP_STATUS,
  MOCK_LIMITS,
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
  static parseQty(rawQty) {
    if (rawQty === undefined || rawQty === '') return MOCK_LIMITS.DEFAULT_QTY;
    const qty = Number(rawQty);
    if (!Number.isInteger(qty) || qty < MOCK_LIMITS.MIN_QTY || qty > MOCK_LIMITS.MAX_QTY) {
      throw new AppError(
        `qty debe ser un entero entre ${MOCK_LIMITS.MIN_QTY} y ${MOCK_LIMITS.MAX_QTY}`,
        HTTP_STATUS.BAD_REQUEST
      );
    }
    return qty;
  }

  static generateUsers(rawQty) {
    const qty = MockService.parseQty(rawQty);
    return Array.from({ length: qty }, () => buildMockUser(randomUserRole()));
  }

  static generateCouriers(rawQty) {
    const qty = MockService.parseQty(rawQty);
    return Array.from({ length: qty }, () => buildMockUser(USER_ROLES.COURIER));
  }

  // Dataset coherente: qty clientes, ceil(qty/3) repartidores, qty pedidos
  // (cada uno de un cliente) y una entrega por cada pedido que corresponda.
  static generateDataset(rawQty) {
    const qty = MockService.parseQty(rawQty);
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
      throw new AppError('La carga de datos de prueba está deshabilitada en producción', HTTP_STATUS.FORBIDDEN);
    }
  }

  static async withPassword(users) {
    const password = await bcrypt.hash(MOCK_PASSWORD, SALT_ROUNDS);
    return users.map((u) => ({ ...u, password }));
  }

  static async seedUsers(rawQty) {
    MockService.assertSeedAllowed();
    const users = await MockService.withPassword(MockService.generateUsers(rawQty));
    const inserted = await UserRepository.insertMany(users);
    return { insertados: inserted.length, coleccion: MOCK_COLLECTIONS.USERS };
  }

  static async seedAll(rawQty) {
    MockService.assertSeedAllowed();
    const dataset = MockService.generateDataset(rawQty);
    const users = await MockService.withPassword(dataset.users);

    // Orden por dependencias: usuarios -> pedidos -> entregas.
    const insertedUsers = await UserRepository.insertMany(users);
    const insertedOrders = await OrderRepository.insertMany(dataset.orders);
    const insertedDeliveries = dataset.deliveries.length
      ? await DeliveryRepository.insertMany(dataset.deliveries)
      : [];

    const colecciones = {
      [MOCK_COLLECTIONS.USERS]: insertedUsers.length,
      [MOCK_COLLECTIONS.ORDERS]: insertedOrders.length,
      [MOCK_COLLECTIONS.DELIVERIES]: insertedDeliveries.length,
    };
    const insertados = Object.values(colecciones).reduce((a, b) => a + b, 0);
    return { insertados, colecciones };
  }
}

module.exports = MockService;
