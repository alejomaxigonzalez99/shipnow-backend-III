const OrderRepository = require('../repositories/order.repository');
const UserService = require('./user.service');
const logger = require('../config/logger.config');
const {
  OrderNotFoundError,
  InvalidStatusError,
  InvalidStatusTransitionError,
  MissingFieldsError,
  ValidationError,
} = require('../errors');
const { ORDER_STATUS, ORDER_PRIORITY, ORDER_STATUS_TRANSITIONS } = require('../constants');

const ORDER_STATUSES = Object.values(ORDER_STATUS);
const ORDER_PRIORITIES = Object.values(ORDER_PRIORITY);

const validateItems = (items) => {
  if (!Array.isArray(items) || items.length === 0) {
    return [{ field: 'items', message: 'Debe ser un arreglo con al menos un ítem' }];
  }
  const problems = [];
  items.forEach((item, i) => {
    if (typeof item?.name !== 'string' || item.name.trim() === '') {
      problems.push({ field: `items[${i}].name`, message: 'Debe ser un texto no vacío' });
    }
    if (!Number.isInteger(item?.quantity) || item.quantity < 1) {
      problems.push({ field: `items[${i}].quantity`, message: 'Debe ser un entero mayor o igual a 1' });
    }
    if (typeof item?.unitPrice !== 'number' || !(item.unitPrice >= 0)) {
      problems.push({ field: `items[${i}].unitPrice`, message: 'Debe ser un número mayor o igual a 0' });
    }
  });
  return problems;
};

class OrderService {
  static async getAll({ status } = {}) {
    if (status !== undefined && !ORDER_STATUSES.includes(status)) {
      throw new InvalidStatusError('pedido', status, ORDER_STATUSES);
    }
    return OrderRepository.getAll(status ? { status } : {});
  }

  static async getById(id) {
    const order = await OrderRepository.getById(id);
    if (!order) throw new OrderNotFoundError(id);
    return order;
  }

  // Regla de negocio: el pedido pertenece a un usuario existente, el total se calcula
  // en el servidor y siempre nace en estado PENDING.
  static async create({ user, items, shippingAddress, priority = ORDER_PRIORITY.NORMAL }) {
    const missing = Object.entries({ user, items, shippingAddress })
      .filter(([, value]) => value === undefined || value === '')
      .map(([key]) => key);
    if (missing.length > 0) throw new MissingFieldsError(missing);

    const problems = validateItems(items);
    if (typeof shippingAddress !== 'string' || shippingAddress.trim() === '') {
      problems.push({ field: 'shippingAddress', message: 'Debe ser un texto no vacío' });
    }
    if (!ORDER_PRIORITIES.includes(priority)) {
      problems.push({ field: 'priority', message: `Permitidos: ${ORDER_PRIORITIES.join(', ')}` });
    }
    if (problems.length > 0) throw new ValidationError(problems);

    await UserService.getById(user); // UserNotFoundError si no existe

    const total = items.reduce((acc, i) => acc + i.quantity * i.unitPrice, 0);
    const order = await OrderRepository.create({
      user,
      items,
      total,
      shippingAddress,
      priority,
      status: ORDER_STATUS.PENDING,
    });
    logger.info(`Pedido creado: ${order._id} (usuario ${user}, total ${total}, prioridad ${priority})`);
    return order;
  }

  // Regla de negocio: el estado solo puede avanzar por transiciones permitidas.
  static async updateStatus(id, newStatus) {
    if (!ORDER_STATUSES.includes(newStatus)) {
      throw new InvalidStatusError('pedido', newStatus, ORDER_STATUSES);
    }
    const order = await OrderService.getById(id);
    const allowed = ORDER_STATUS_TRANSITIONS[order.status];
    if (!allowed.includes(newStatus)) {
      throw new InvalidStatusTransitionError('pedido', order.status, newStatus, allowed);
    }
    const updated = await OrderRepository.updateStatus(id, newStatus);
    logger.info(`Pedido ${id} actualizado: ${order.status} -> ${newStatus}`);
    return updated;
  }
}

module.exports = OrderService;
