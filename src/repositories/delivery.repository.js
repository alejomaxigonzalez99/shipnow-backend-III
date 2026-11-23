const Delivery = require('../models/delivery.model');

class DeliveryRepository {
  static getAll(filter = {}, { page = 1, limit = 50 } = {}) {
    return Delivery.find(filter).sort({ _id: -1 }).skip((page - 1) * limit).limit(limit).lean();
  }

  static getById(id) {
    return Delivery.findById(id).lean();
  }

  static update(id, data) {
    return Delivery.findByIdAndUpdate(id, data, { new: true, runValidators: true }).lean();
  }

  static addReceipt(id, receipt) {
    return Delivery.findByIdAndUpdate(
      id,
      { $set: { receipt } },
      { new: true, runValidators: true }
    ).lean();
  }

  static deleteManyByIds(ids) {
    return Delivery.deleteMany({ _id: { $in: ids } });
  }

  static insertMany(docs) {
    return Delivery.insertMany(docs);
  }
}

module.exports = DeliveryRepository;
