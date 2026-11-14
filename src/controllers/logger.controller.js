const LoggerService = require('../services/logger.service');
const asyncHandler = require('../middlewares/async-handler');
const { HTTP_STATUS } = require('../constants');

class LoggerController {
  static test = asyncHandler(async (req, res) => {
    const result = LoggerService.emitTestLogs();
    res.status(HTTP_STATUS.OK).json({ status: 'success', payload: result });
  });
}

module.exports = LoggerController;
