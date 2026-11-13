const UserService = require('../services/user.service');
const { HTTP_STATUS } = require('../constants');

class UserController {
  static async getAll(req, res, next) {
    try {
      const users = await UserService.getAll();
      res.status(HTTP_STATUS.OK).json({ status: 'success', payload: users });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req, res, next) {
    try {
      const user = await UserService.getById(req.params.id);
      res.status(HTTP_STATUS.OK).json({ status: 'success', payload: user });
    } catch (error) {
      next(error);
    }
  }

  static async create(req, res, next) {
    try {
      const user = await UserService.create(req.body);
      res.status(HTTP_STATUS.CREATED).json({ status: 'success', payload: user });
    } catch (error) {
      next(error);
    }
  }

  static async update(req, res, next) {
    try {
      const user = await UserService.update(req.params.id, req.body);
      res.status(HTTP_STATUS.OK).json({ status: 'success', payload: user });
    } catch (error) {
      next(error);
    }
  }

  static async delete(req, res, next) {
    try {
      await UserService.delete(req.params.id);
      res.status(HTTP_STATUS.OK).json({ status: 'success', message: 'Usuario eliminado' });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = UserController;
