const ProductRepository = require('../repositories/product.repository');
const {
  ProductNotFoundError,
  MissingFieldsError,
  ValidationError,
  InvalidStatusError,
} = require('../errors');
const { PRODUCT_STATUS } = require('../constants');

const resolveStatus = (stock, currentStatus) => {
  if (currentStatus === PRODUCT_STATUS.DISCONTINUED) return currentStatus;
  return stock > 0 ? PRODUCT_STATUS.AVAILABLE : PRODUCT_STATUS.OUT_OF_STOCK;
};

// Valida los campos presentes; devuelve la lista de problemas encontrados.
const validateProductFields = ({ name, price, stock }) => {
  const problems = [];
  if (name !== undefined && (typeof name !== 'string' || name.trim() === '')) {
    problems.push({ field: 'name', message: 'Debe ser un texto no vacío' });
  }
  if (price !== undefined && (typeof price !== 'number' || !Number.isFinite(price) || price < 0)) {
    problems.push({ field: 'price', message: 'Debe ser un número mayor o igual a 0' });
  }
  if (stock !== undefined && (!Number.isInteger(stock) || stock < 0)) {
    problems.push({ field: 'stock', message: 'Debe ser un entero mayor o igual a 0' });
  }
  return problems;
};

const assertValidProduct = (data) => {
  const problems = validateProductFields(data);
  if (problems.length > 0) throw new ValidationError(problems);
};

class ProductService {
  // Regla de negocio: el listado público solo muestra productos con stock disponible.
  static async getAll({ includeOutOfStock = false } = {}) {
    const products = await ProductRepository.getAll();
    if (includeOutOfStock) return products;
    return products.filter((p) => p.stock > 0 && p.status === PRODUCT_STATUS.AVAILABLE);
  }

  static async getById(id) {
    const product = await ProductRepository.getById(id);
    if (!product) throw new ProductNotFoundError(id);
    return product;
  }

  static async create(data) {
    const missing = ['name', 'price'].filter((f) => data[f] === undefined);
    if (missing.length > 0) throw new MissingFieldsError(missing);
    assertValidProduct(data);

    const stock = data.stock ?? 0;
    return ProductRepository.create({ ...data, stock, status: resolveStatus(stock) });
  }

  static async update(id, data) {
    assertValidProduct(data);
    if (data.status !== undefined && !Object.values(PRODUCT_STATUS).includes(data.status)) {
      throw new InvalidStatusError('producto', data.status, Object.values(PRODUCT_STATUS));
    }

    const existing = await ProductService.getById(id);
    const stock = data.stock ?? existing.stock;
    const status = data.status ?? resolveStatus(stock, existing.status);
    return ProductRepository.update(id, { ...data, status });
  }

  static async delete(id) {
    const deleted = await ProductRepository.delete(id);
    if (!deleted) throw new ProductNotFoundError(id);
    return deleted;
  }
}

module.exports = ProductService;
