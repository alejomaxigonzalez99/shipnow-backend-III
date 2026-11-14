// Envuelve un handler async para que cualquier error/rechazo llegue al middleware global.
const asyncHandler = (handler) => (req, res, next) =>
  Promise.resolve(handler(req, res, next)).catch(next);

module.exports = asyncHandler;
