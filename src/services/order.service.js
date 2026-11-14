const OrderRepository = require('../repositories/order.repository');
const { OrderNotFoundError, InvalidStatusError, InvalidStatusTransitionError } = require('../errors');
const { ORDER_STATUS, ORDER_STATUS_TRANSITIONS } = require('../constants');

const ORDER_STATUSES = Object.values(ORDER_STATUS);

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
    return OrderRepository.updateStatus(id, newStatus);
  }
}

module.exports = OrderService;
