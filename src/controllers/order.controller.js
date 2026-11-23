const OrderService = require('../services/order.service');
const asyncHandler = require('../middlewares/async-handler');
const { HTTP_STATUS } = require('../constants');
const { parsePagination } = require('../utils/pagination');

class OrderController {
  static getAll = asyncHandler(async (req, res) => {
    const orders = await OrderService.getAll({ status: req.query.status, ...parsePagination(req.query) });
    res.status(HTTP_STATUS.OK).json({ status: 'success', payload: orders });
  });

  static getById = asyncHandler(async (req, res) => {
    const order = await OrderService.getById(req.params.id);
    res.status(HTTP_STATUS.OK).json({ status: 'success', payload: order });
  });

  static create = asyncHandler(async (req, res) => {
    const order = await OrderService.create(req.body);
    res.status(HTTP_STATUS.CREATED).json({ status: 'success', payload: order });
  });

  static updateStatus = asyncHandler(async (req, res) => {
    const order = await OrderService.updateStatus(req.params.id, req.body.status);
    res.status(HTTP_STATUS.OK).json({ status: 'success', payload: order });
  });
}

module.exports = OrderController;
