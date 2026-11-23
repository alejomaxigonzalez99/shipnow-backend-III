const Order = require('../models/order.model');

class OrderRepository {
  static getAll(filter = {}, { page = 1, limit = 50 } = {}) {
    return Order.find(filter).sort({ _id: -1 }).skip((page - 1) * limit).limit(limit).lean();
  }

  static getById(id) {
    return Order.findById(id).lean();
  }

  static create(data) {
    return Order.create(data).then((doc) => doc.toObject());
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
