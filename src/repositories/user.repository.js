const User = require('../models/user.model');

class UserRepository {
  static getAll() {
    return User.find().lean();
  }

  static getById(id) {
    return User.findById(id).lean();
  }

  static getByEmail(email) {
    return User.findOne({ email: email.toLowerCase() }).lean();
  }

  static async create(data) {
    const doc = await User.create(data);
    const { password, ...safeUser } = doc.toObject();
    return safeUser;
  }

  static deleteManyByIds(ids) {
    return User.deleteMany({ _id: { $in: ids } });
  }

  static insertMany(docs) {
    return User.insertMany(docs);
  }

  static update(id, data) {
    return User.findByIdAndUpdate(id, data, { new: true, runValidators: true }).lean();
  }

  static delete(id) {
    return User.findByIdAndDelete(id).lean();
  }
}

module.exports = UserRepository;
