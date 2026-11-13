const Delivery = require('../models/delivery.model');

class DeliveryRepository {
  static getAll(filter = {}) {
    return Delivery.find(filter).lean();
  }

  static getById(id) {
    return Delivery.findById(id).lean();
  }

  static insertMany(docs) {
    return Delivery.insertMany(docs);
  }
}

module.exports = DeliveryRepository;
