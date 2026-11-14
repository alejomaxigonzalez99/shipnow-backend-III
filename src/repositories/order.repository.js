const Order = require('../models/order.model');

class OrderRepository {
  static getAll(filter = {}) {
    return Order.find(filter).lean();
  }

  static getById(id) {
    return Order.findById(id).lean();
  }

  static updateStatus(id, status) {
    return Order.findByIdAndUpdate(id, { status }, { new: true, runValidators: true }).lean();
  }

  static deleteManyByIds(ids) {
    return Order.deleteMany({ _id: { $in: ids } });
  }

  static insertMany(docs) {
    return Order.insertMany(docs);
  }
}

module.exports = OrderRepository;
