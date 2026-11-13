const MockService = require('../services/mock.service');
const { HTTP_STATUS } = require('../constants');

// Cada handler llama al servicio y responde; los errores van al middleware central.
const respondWith = (serviceMethod, successStatus = HTTP_STATUS.OK) => async (req, res, next) => {
  try {
    const result = await serviceMethod(req.query.qty);
    res.status(successStatus).json(result);
  } catch (error) {
    next(error);
  }
};

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
