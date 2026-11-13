const ProductRepository = require('../repositories/product.repository');
const AppError = require('../utils/app-error');
const { PRODUCT_STATUS, HTTP_STATUS } = require('../constants');

const resolveStatus = (stock, currentStatus) => {
  if (currentStatus === PRODUCT_STATUS.DISCONTINUED) return currentStatus;
  return stock > 0 ? PRODUCT_STATUS.AVAILABLE : PRODUCT_STATUS.OUT_OF_STOCK;
};

class ProductService {
  // Regla de negocio: el listado público solo muestra productos con stock disponible.
  static async getAll({ includeOutOfStock = false } = {}) {
    const products = await ProductRepository.getAll();
    if (includeOutOfStock) return products;
    return products.filter(
      (p) => p.stock > 0 && p.status === PRODUCT_STATUS.AVAILABLE
    );
  }

  static async getById(id) {
    const product = await ProductRepository.getById(id);
    if (!product) throw new AppError('Producto no encontrado', HTTP_STATUS.NOT_FOUND);
    return product;
  }

  static async create(data) {
    const { name, price } = data;
    if (!name || price === undefined) {
      throw new AppError('name y price son obligatorios', HTTP_STATUS.BAD_REQUEST);
    }
    const stock = data.stock ?? 0;
    return ProductRepository.create({ ...data, stock, status: resolveStatus(stock) });
  }

  static async update(id, data) {
    const existing = await ProductService.getById(id);
    const stock = data.stock ?? existing.stock;
    const status = data.status ?? resolveStatus(stock, existing.status);
    return ProductRepository.update(id, { ...data, status });
  }

  static async delete(id) {
    const deleted = await ProductRepository.delete(id);
    if (!deleted) throw new AppError('Producto no encontrado', HTTP_STATUS.NOT_FOUND);
    return deleted;
  }
}

module.exports = ProductService;
