
const pkg = require('../../package.json');
const config = require('../config/env.config');

const { schemas } = require('./components/schemas');
const { parameters } = require('./components/parameters');

const { usersPaths } = require('./paths/users.docs');
const { productsPaths } = require('./paths/products.docs');
const { ordersPaths } = require('./paths/orders.docs');
const { deliveriesPaths } = require('./paths/deliveries.docs');
const { mocksPaths } = require('./paths/mocks.docs');
const { loggerPaths } = require('./paths/logger.docs');
const { uploadsPaths } = require('./paths/uploads.docs');

const isProduction = config.IS_PRODUCTION;

const DESCRIPTION = `
API REST de **ShipNow**, un sistema de gestión de envíos: usuarios (clientes, repartidores y administradores), productos, pedidos y entregas.

**Propósito:** consultar y probar interactivamente los endpoints mediante Swagger UI.

### Formato de las respuestas
- **Éxito:** las respuestas utilizan \`status: success\` y \`payload\` (o \`message\` al eliminar). Los endpoints de Mocks devuelven los datos directamente.
- **Error:** las respuestas utilizan \`status: error\`, \`statusCode\`, \`error\`, \`path\` y \`timestamp\`. Ver el schema \`ErrorResponse\`.

### Autenticación
La API no implementa autenticación: ningún endpoint requiere token.

### Cómo empezar
${
  isProduction
    ? 'Consultá los endpoints disponibles y utilizá los datos existentes en la base de datos.'
    : '1. Generá datos de prueba con `POST /api/mocks/seed?qty=10`.\n2. Consultalos con `GET /api/users`, `GET /api/orders` y `GET /api/deliveries`.'
}
`;

const TAGS = [
  { name: 'Health', description: 'Estado de salud de la API.' },
  { name: 'Users', description: 'Gestión de usuarios. Roles: ADMIN, CUSTOMER, COURIER.' },
  { name: 'Products', description: 'Catálogo de productos y su stock.' },
  { name: 'Orders', description: 'Pedidos: creación, consulta y cambios de estado.' },
  { name: 'Deliveries', description: 'Entregas, repartidores, comprobantes y estados.' },
  { name: 'Uploads', description: 'Carga de documentos y comprobantes.' },
  ...(
    isProduction
      ? []
      : [
          { name: 'Mocks', description: 'Generación e inserción de datos de prueba.' },
          { name: 'Logger', description: 'Herramienta interna para validar los logs.' },
        ]
  ),
];

const buildSpec = () => ({
  openapi: '3.0.3',

  info: {
    title: 'ShipNow API',
    version: pkg.version,
    description: DESCRIPTION,
  },

  servers: [
    {
      url: `http://localhost:${config.PORT}`,
      description: 'Servidor local',
    },
  ],

  tags: TAGS,

  paths: {
    '/health': {
      get: {
        tags: ['Health'],
        summary: 'Estado de salud de la API',
        responses: {
          200: {
            description: 'API disponible',
          },
        },
      },
    },

    ...usersPaths,
    ...productsPaths,
    ...ordersPaths,
    ...deliveriesPaths,
    ...uploadsPaths,

    ...(
      isProduction
        ? {}
        : {
            ...mocksPaths,
            ...loggerPaths,
          }
    ),
  },

  components: {
    schemas,
    parameters,
  },
});

module.exports = buildSpec;
