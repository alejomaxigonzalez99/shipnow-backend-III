const ProductService = require('../services/product.service');
const { HTTP_STATUS } = require('../constants');

class ProductController {
  static async getAll(req, res, next) {
    try {
      const includeOutOfStock = req.query.includeOutOfStock === 'true';
      const products = await ProductService.getAll({ includeOutOfStock });
      res.status(HTTP_STATUS.OK).json({ status: 'success', payload: products });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req, res, next) {
    try {
      const product = await ProductService.getById(req.params.id);
      res.status(HTTP_STATUS.OK).json({ status: 'success', payload: product });
    } catch (error) {
      next(error);
    }
  }

  static async create(req, res, next) {
    try {
      const product = await ProductService.create(req.body);
      res.status(HTTP_STATUS.CREATED).json({ status: 'success', payload: product });
    } catch (error) {
      next(error);
    }
  }

  static async update(req, res, next) {
    try {
      const product = await ProductService.update(req.params.id, req.body);
      res.status(HTTP_STATUS.OK).json({ status: 'success', payload: product });
    } catch (error) {
      next(error);
    }
  }

  static async delete(req, res, next) {
    try {
      await ProductService.delete(req.params.id);
      res.status(HTTP_STATUS.OK).json({ status: 'success', message: 'Producto eliminado' });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = ProductController;
