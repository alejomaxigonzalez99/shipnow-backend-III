const Order = require('../models/order.model');

class OrderRepository {
  static getAll(filter = {}) {
    return Order.find(filter).lean();
  }

  static getById(id) {
    return Order.findById(id).lean();
  }

  static insertMany(docs) {
    return Order.insertMany(docs);
  }
}

module.exports = OrderRepository;
