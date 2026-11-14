const MockService = require('../services/mock.service');
const asyncHandler = require('../middlewares/async-handler');
const { HTTP_STATUS } = require('../constants');

// Cada handler llama al servicio y responde; los errores los resuelve el middleware global.
const respondWith = (serviceMethod, successStatus = HTTP_STATUS.OK) =>
  asyncHandler(async (req, res) => {
    const result = await serviceMethod(req.query.qty);
    res.status(successStatus).json(result);
  });

class MockController {
  static getUsers = respondWith(MockService.generateUsers);
  static getCouriers = respondWith(MockService.generateCouriers);
  static getOrders = respondWith(MockService.generateOrders);
  static getDeliveries = respondWith(MockService.generateDeliveries);
  static getDataset = respondWith(MockService.generateDataset);
  static seedUsers = respondWith(MockService.seedUsers, HTTP_STATUS.CREATED);
  static seedAll = respondWith(MockService.seedAll, HTTP_STATUS.CREATED);
}

module.exports = MockController;
