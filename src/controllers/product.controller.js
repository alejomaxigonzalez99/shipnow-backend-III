const ProductService = require('../services/product.service');
const asyncHandler = require('../middlewares/async-handler');
const { HTTP_STATUS } = require('../constants');

class ProductController {
  static getAll = asyncHandler(async (req, res) => {
    const includeOutOfStock = req.query.includeOutOfStock === 'true';
    const products = await ProductService.getAll({ includeOutOfStock });
    res.status(HTTP_STATUS.OK).json({ status: 'success', payload: products });
  });

  static getById = asyncHandler(async (req, res) => {
    const product = await ProductService.getById(req.params.id);
    res.status(HTTP_STATUS.OK).json({ status: 'success', payload: product });
  });

  static create = asyncHandler(async (req, res) => {
    const product = await ProductService.create(req.body);
    res.status(HTTP_STATUS.CREATED).json({ status: 'success', payload: product });
  });

  static update = asyncHandler(async (req, res) => {
    const product = await ProductService.update(req.params.id, req.body);
    res.status(HTTP_STATUS.OK).json({ status: 'success', payload: product });
  });

  static delete = asyncHandler(async (req, res) => {
    await ProductService.delete(req.params.id);
    res.status(HTTP_STATUS.OK).json({ status: 'success', message: 'Producto eliminado' });
  });
}

module.exports = ProductController;
