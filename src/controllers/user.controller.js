const UserService = require('../services/user.service');
const asyncHandler = require('../middlewares/async-handler');
const { HTTP_STATUS } = require('../constants');

class UserController {
  static getAll = asyncHandler(async (req, res) => {
    const users = await UserService.getAll();
    res.status(HTTP_STATUS.OK).json({ status: 'success', payload: users });
  });

  static getById = asyncHandler(async (req, res) => {
    const user = await UserService.getById(req.params.id);
    res.status(HTTP_STATUS.OK).json({ status: 'success', payload: user });
  });

  static create = asyncHandler(async (req, res) => {
    const user = await UserService.create(req.body);
    res.status(HTTP_STATUS.CREATED).json({ status: 'success', payload: user });
  });

  static update = asyncHandler(async (req, res) => {
    const user = await UserService.update(req.params.id, req.body);
    res.status(HTTP_STATUS.OK).json({ status: 'success', payload: user });
  });

  static delete = asyncHandler(async (req, res) => {
    await UserService.delete(req.params.id);
    res.status(HTTP_STATUS.OK).json({ status: 'success', message: 'Usuario eliminado' });
  });
}

module.exports = UserController;
