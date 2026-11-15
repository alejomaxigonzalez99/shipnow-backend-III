const {
  ref, paramRef, errorResponses, successResponse, messageResponse, jsonBody,
  INTERNAL, DB_DOWN, INVALID_JSON, INVALID_ID,
} = require('../helpers');
const { OBJECT_ID_EXAMPLE } = require('../components/schemas');
const { PRODUCT_STATUS } = require('../../constants');

const TAG = 'Products';
const productExample = {
  _id: OBJECT_ID_EXAMPLE,
  name: 'Auriculares Bluetooth',
  description: 'Cancelación de ruido',
  price: 15000,
  stock: 12,
  status: 'AVAILABLE',
};
const notFound = { code: 'PRODUCT_NOT_FOUND', message: `Producto no encontrado: ${OBJECT_ID_EXAMPLE}`, details: { id: OBJECT_ID_EXAMPLE } };
const validation = {
  code: 'VALIDATION_ERROR',
  details: { fields: [{ field: 'price', message: 'Debe ser un número mayor o igual a 0' }] },
};
const invalidStatus = {
  code: 'INVALID_STATUS',
  message: 'Estado inválido para producto: "ROTO". Permitidos: AVAILABLE, OUT_OF_STOCK, DISCONTINUED',
  details: { entity: 'producto', received: 'ROTO', allowed: Object.values(PRODUCT_STATUS) },
};

const productsPaths = {
  '/api/products': {
    get: {
      tags: [TAG],
      summary: 'Listar productos',
      description: 'Por regla de negocio solo devuelve productos disponibles (`AVAILABLE` y con stock). Con `includeOutOfStock=true` devuelve todos.',
      operationId: 'listProducts',
      parameters: [
        {
          name: 'includeOutOfStock',
          in: 'query',
          required: false,
          description: 'Si es exactamente `true`, incluye productos sin stock o discontinuados',
          schema: { type: 'boolean', default: false },
        },
      ],
      responses: {
        200: successResponse('Lista de productos', { type: 'array', items: ref('Product') }, [productExample]),
        ...errorResponses('/api/products', [DB_DOWN, INTERNAL]),
      },
    },
    post: {
      tags: [TAG],
      summary: 'Crear producto',
      description: 'El estado se calcula según el stock (`AVAILABLE` si hay stock, `OUT_OF_STOCK` si es 0).',
      operationId: 'createProduct',
      requestBody: jsonBody('ProductCreate', { name: 'Auriculares Bluetooth', price: 15000, stock: 12 }),
      responses: {
        201: successResponse('Producto creado', ref('Product'), productExample),
        ...errorResponses('/api/products', [
          { code: 'MISSING_FIELDS', details: { fields: ['name', 'price'] } },
          validation,
          INVALID_JSON,
          DB_DOWN,
          INTERNAL,
        ]),
      },
    },
  },
  '/api/products/{id}': {
    get: {
      tags: [TAG],
      summary: 'Obtener un producto por ID',
      operationId: 'getProductById',
      parameters: [paramRef('Id')],
      responses: {
        200: successResponse('Producto encontrado', ref('Product'), productExample),
        ...errorResponses(`/api/products/${OBJECT_ID_EXAMPLE}`, [INVALID_ID(), notFound, DB_DOWN, INTERNAL]),
      },
    },
    put: {
      tags: [TAG],
      summary: 'Actualizar un producto',
      operationId: 'updateProduct',
      parameters: [paramRef('Id')],
      requestBody: jsonBody('ProductUpdate', { price: 17000, stock: 0 }),
      responses: {
        200: successResponse('Producto actualizado', ref('Product'), { ...productExample, price: 17000, stock: 0, status: 'OUT_OF_STOCK' }),
        ...errorResponses(`/api/products/${OBJECT_ID_EXAMPLE}`, [
          INVALID_ID(), validation, invalidStatus, INVALID_JSON, notFound, DB_DOWN, INTERNAL,
        ]),
      },
    },
    delete: {
      tags: [TAG],
      summary: 'Eliminar un producto',
      operationId: 'deleteProduct',
      parameters: [paramRef('Id')],
      responses: {
        200: messageResponse('Producto eliminado', 'Producto eliminado'),
        ...errorResponses(`/api/products/${OBJECT_ID_EXAMPLE}`, [INVALID_ID(), notFound, DB_DOWN, INTERNAL]),
      },
    },
  },
};

module.exports = { productsPaths };
