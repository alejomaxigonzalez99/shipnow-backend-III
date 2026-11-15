const Delivery = require('../models/delivery.model');

class DeliveryRepository {
  static getAll(filter = {}) {
    return Delivery.find(filter).lean();
  }

  static getById(id) {
    return Delivery.findById(id).lean();
  }

  static update(id, data) {
    return Delivery.findByIdAndUpdate(id, data, { new: true, runValidators: true }).lean();
  }

  static deleteManyByIds(ids) {
    return Delivery.deleteMany({ _id: { $in: ids } });
  }

  static insertMany(docs) {
    return Delivery.insertMany(docs);
  }
}

module.exports = DeliveryRepository;
