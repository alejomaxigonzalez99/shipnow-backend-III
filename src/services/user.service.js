const bcrypt = require('bcryptjs');
const fs = require('fs/promises');
const UserRepository = require('../repositories/user.repository');
const logger = require('../config/logger.config');
const {
  UserNotFoundError,
  MissingFieldsError,
  InvalidRoleError,
  EmailAlreadyExistsError,
  FileRequiredError,
  InvalidDocumentTypeError,
  FileUploadFailedError,
  AppError,
} = require('../errors');
const { USER_ROLES, USER_DOCUMENT_TYPES } = require('../constants');

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

  static async addDocument(id, file, documentType) {
    if (!file) throw new FileRequiredError();
    const allowedTypes = Object.values(USER_DOCUMENT_TYPES);
    const resolvedType = documentType || USER_DOCUMENT_TYPES.OTHER;
    if (!allowedTypes.includes(resolvedType)) {
      await fs.unlink(file.path).catch(() => {});
      throw new InvalidDocumentTypeError(resolvedType, allowedTypes);
    }

    try {
      const user = await UserService.getById(id);
      const { buildFileMetadata } = require('../config/upload.config');
      const metadata = buildFileMetadata(file, resolvedType);
      const updated = await UserRepository.addDocument(id, metadata);
      if (!updated) throw new UserNotFoundError(id);
      logger.info(`Documento cargado: usuario ${id}, tipo ${resolvedType}, archivo ${metadata.filename}`);
      return updated;
    } catch (error) {
      await fs.unlink(file.path).catch(() => {});
      if (
        error instanceof AppError ||
        error.name === 'CastError' ||
        error.name === 'MongooseError' ||
        error.name?.startsWith('Mongo') ||
        error.code === 11000
      ) throw error;
      throw new FileUploadFailedError(error);
    }
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
    const user = await UserRepository.create({ name, email, password: hashed, role });
    logger.info(`Usuario creado: ${user._id} (rol ${user.role})`);
    return user;
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
