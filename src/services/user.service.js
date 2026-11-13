const bcrypt = require('bcryptjs');
const UserRepository = require('../repositories/user.repository');
const AppError = require('../utils/app-error');
const { USER_ROLES, HTTP_STATUS } = require('../constants');

const SALT_ROUNDS = 10;

class UserService {
  static getAll() {
    return UserRepository.getAll();
  }

  static async getById(id) {
    const user = await UserRepository.getById(id);
    if (!user) throw new AppError('Usuario no encontrado', HTTP_STATUS.NOT_FOUND);
    return user;
  }

  static async create({ name, email, password, role }) {
    if (!name || !email || !password) {
      throw new AppError('name, email y password son obligatorios', HTTP_STATUS.BAD_REQUEST);
    }
    if (role && !Object.values(USER_ROLES).includes(role)) {
      throw new AppError(`Rol inválido. Permitidos: ${Object.values(USER_ROLES).join(', ')}`, HTTP_STATUS.BAD_REQUEST);
    }
    const existing = await UserRepository.getByEmail(email);
    if (existing) throw new AppError('El email ya está registrado', HTTP_STATUS.CONFLICT);

    const hashed = await bcrypt.hash(password, SALT_ROUNDS);
    return UserRepository.create({ name, email, password: hashed, role });
  }

  static async update(id, data) {
    await UserService.getById(id);
    const payload = { ...data };
    if (payload.password) payload.password = await bcrypt.hash(payload.password, SALT_ROUNDS);
    if (payload.role && !Object.values(USER_ROLES).includes(payload.role)) {
      throw new AppError('Rol inválido', HTTP_STATUS.BAD_REQUEST);
    }
    return UserRepository.update(id, payload);
  }

  static async delete(id) {
    const deleted = await UserRepository.delete(id);
    if (!deleted) throw new AppError('Usuario no encontrado', HTTP_STATUS.NOT_FOUND);
    return deleted;
  }
}

module.exports = UserService;
