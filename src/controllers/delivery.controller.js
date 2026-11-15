const DeliveryService = require('../services/delivery.service');
const asyncHandler = require('../middlewares/async-handler');
const { HTTP_STATUS } = require('../constants');

class DeliveryController {
  static getAll = asyncHandler(async (req, res) => {
    const deliveries = await DeliveryService.getAll({ status: req.query.status });
    res.status(HTTP_STATUS.OK).json({ status: 'success', payload: deliveries });
  });

  static getById = asyncHandler(async (req, res) => {
    const delivery = await DeliveryService.getById(req.params.id);
    res.status(HTTP_STATUS.OK).json({ status: 'success', payload: delivery });
  });

  static uploadReceipt = asyncHandler(async (req, res) => {
    const delivery = await DeliveryService.addReceipt(req.params.id, req.file);
    res.status(HTTP_STATUS.CREATED).json({ status: 'success', payload: delivery });
  });

  static assignCourier = asyncHandler(async (req, res) => {
    const delivery = await DeliveryService.assignCourier(req.params.id, req.body.courier);
    res.status(HTTP_STATUS.OK).json({ status: 'success', payload: delivery });
  });

  static updateStatus = asyncHandler(async (req, res) => {
    const delivery = await DeliveryService.updateStatus(req.params.id, req.body.status);
    res.status(HTTP_STATUS.OK).json({ status: 'success', payload: delivery });
  });
}

module.exports = DeliveryController;
