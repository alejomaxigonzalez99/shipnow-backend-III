const Product = require('../models/product.model');

class ProductRepository {
  static getAll(filter = {}) {
    return Product.find(filter).lean();
  }

  static getById(id) {
    return Product.findById(id).lean();
  }

  static create(data) {
    return Product.create(data).then((doc) => doc.toObject());
  }

  static update(id, data) {
    return Product.findByIdAndUpdate(id, data, { new: true, runValidators: true }).lean();
  }

  static delete(id) {
    return Product.findByIdAndDelete(id).lean();
  }
}

module.exports = ProductRepository;
