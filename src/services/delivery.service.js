const DeliveryRepository = require('../repositories/delivery.repository');
const UserService = require('./user.service');
const logger = require('../config/logger.config');
const {
  DeliveryNotFoundError,
  InvalidStatusError,
  InvalidStatusTransitionError,
  InvalidCourierError,
  DeliveryCourierRequiredError,
  MissingFieldsError,
} = require('../errors');
const {
  DELIVERY_STATUS,
  DELIVERY_STATUS_TRANSITIONS,
  DELIVERY_STATUSES_REQUIRING_COURIER,
  USER_ROLES,
} = require('../constants');

const DELIVERY_STATUSES = Object.values(DELIVERY_STATUS);
// Solo se puede (re)asignar repartidor mientras la entrega no salió.
const ASSIGNABLE_STATUSES = [DELIVERY_STATUS.PENDING, DELIVERY_STATUS.ASSIGNED];

class DeliveryService {
  static async getAll({ status } = {}) {
    if (status !== undefined && !DELIVERY_STATUSES.includes(status)) {
      throw new InvalidStatusError('entrega', status, DELIVERY_STATUSES);
    }
    return DeliveryRepository.getAll(status ? { status } : {});
  }

  static async getById(id) {
    const delivery = await DeliveryRepository.getById(id);
    if (!delivery) throw new DeliveryNotFoundError(id);
    return delivery;
  }

  // Regla de negocio: el repartidor debe existir y tener rol COURIER.
  // La entrega pasa a ASSIGNED.
  static async assignCourier(id, courierId) {
    if (!courierId) throw new MissingFieldsError(['courier']);

    const delivery = await DeliveryService.getById(id);
    if (!ASSIGNABLE_STATUSES.includes(delivery.status)) {
      throw new InvalidStatusTransitionError(
        'entrega',
        delivery.status,
        DELIVERY_STATUS.ASSIGNED,
        DELIVERY_STATUS_TRANSITIONS[delivery.status]
      );
    }

    const courier = await UserService.getById(courierId); // UserNotFoundError si no existe
    if (courier.role !== USER_ROLES.COURIER) throw new InvalidCourierError(courierId, courier.role);

    const updated = await DeliveryRepository.update(id, {
      courier: courierId,
      status: DELIVERY_STATUS.ASSIGNED,
    });
    logger.info(`Entrega ${id}: repartidor ${courierId} asignado`);
    return updated;
  }

  // Regla de negocio: el estado solo avanza por transiciones permitidas y
  // ASSIGNED / IN_TRANSIT / DELIVERED exigen repartidor.
  static async updateStatus(id, newStatus) {
    if (!DELIVERY_STATUSES.includes(newStatus)) {
      throw new InvalidStatusError('entrega', newStatus, DELIVERY_STATUSES);
    }
    const delivery = await DeliveryService.getById(id);
    const allowed = DELIVERY_STATUS_TRANSITIONS[delivery.status];
    if (!allowed.includes(newStatus)) {
      throw new InvalidStatusTransitionError('entrega', delivery.status, newStatus, allowed);
    }
    if (DELIVERY_STATUSES_REQUIRING_COURIER.includes(newStatus) && !delivery.courier) {
      throw new DeliveryCourierRequiredError(id, newStatus);
    }

    const data = { status: newStatus };
    if (newStatus === DELIVERY_STATUS.DELIVERED) data.deliveredAt = new Date();

    const updated = await DeliveryRepository.update(id, data);
    logger.info(`Entrega ${id} actualizada: ${delivery.status} -> ${newStatus}`);
    return updated;
  }
}

module.exports = DeliveryService;
