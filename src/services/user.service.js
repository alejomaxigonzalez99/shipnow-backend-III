const bcrypt = require('bcryptjs');
const UserRepository = require('../repositories/user.repository');
const {
  UserNotFoundError,
  MissingFieldsError,
  InvalidRoleError,
  EmailAlreadyExistsError,
} = require('../errors');
const { USER_ROLES } = require('../constants');

const SALT_ROUNDS = 10;

const assertValidRole = (role) => {
  const allowed = Object.values(USER_ROLES);
  if (!allowed.includes(role)) throw new InvalidRoleError(role, allowed);
};

class UserService {
  static getAll() {
    return UserRepository.getAll();
  }

  static async getById(id) {
    const user = await UserRepository.getById(id);
    if (!user) throw new UserNotFoundError(id);
    return user;
  }

  static async create({ name, email, password, role }) {
    const missing = Object.entries({ name, email, password })
      .filter(([, value]) => !value)
      .map(([key]) => key);
    if (missing.length > 0) throw new MissingFieldsError(missing);
    if (role !== undefined) assertValidRole(role);

    const existing = await UserRepository.getByEmail(email);
    if (existing) throw new EmailAlreadyExistsError(email);

    const hashed = await bcrypt.hash(password, SALT_ROUNDS);
    return UserRepository.create({ name, email, password: hashed, role });
  }

  static async update(id, data) {
    if (data.role !== undefined) assertValidRole(data.role);
    await UserService.getById(id);

    const payload = { ...data };
    if (payload.password) payload.password = await bcrypt.hash(payload.password, SALT_ROUNDS);
    return UserRepository.update(id, payload);
  }

  static async delete(id) {
    const deleted = await UserRepository.delete(id);
    if (!deleted) throw new UserNotFoundError(id);
    return deleted;
  }
}

module.exports = UserService;
