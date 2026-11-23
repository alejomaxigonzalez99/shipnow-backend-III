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

const DESCRIPTION = `
API REST de **ShipNow**, un sistema de gestión de envíos: usuarios (clientes, repartidores y administradores), productos, pedidos y entregas.

**Propósito de esta documentación:** permitir consultar y probar interactivamente todos los endpoints (botón *Try it out*).

### Formato de las respuestas
- **Éxito** (Users, Products, Orders, Deliveries, Logger): \`{ "status": "success", "payload": ... }\` (o \`message\` al eliminar). Los endpoints de **Mocks** devuelven los datos directamente, sin ese envoltorio.
- **Error** (todos): \`{ "status": "error", "statusCode", "error": { "code", "message", "details?" }, "path", "timestamp" }\`. Ver el schema \`ErrorResponse\`.

### Autenticación
La API **no implementa autenticación**: ningún endpoint requiere token.

### Cómo empezar
1. Generá datos de prueba con \`POST /api/mocks/seed?qty=10\` (Mocks).
2. Consultalos con \`GET /api/users\`, \`GET /api/orders\` y \`GET /api/deliveries\`.
`;

const TAGS = [
  { name: 'Users', description: 'Gestión de usuarios. Roles: ADMIN, CUSTOMER, COURIER (repartidor).' },
  { name: 'Products', description: 'Catálogo de productos y su stock.' },
  { name: 'Orders', description: 'Pedidos: creación, consulta y cambios de estado.' },
  { name: 'Deliveries', description: 'Entregas asociadas a pedidos: consulta, asignación de repartidor, comprobantes y cambios de estado.' },
  { name: 'Mocks', description: 'Generación de datos simulados (sin guardar) y carga de datos de prueba en MongoDB.' },
  { name: 'Uploads', description: 'Carga de documentos de usuarios y comprobantes de entrega mediante multipart/form-data.' },
  { name: 'Logger', description: 'Herramienta interna para validar la configuración de logs. No es funcionalidad de negocio.' },
];

const buildSpec = () => ({
  openapi: '3.0.3',
  info: {
    title: 'ShipNow API',
    version: pkg.version,
    description: DESCRIPTION,
  },
  servers: [{ url: `http://localhost:${config.PORT}`, description: 'Servidor local' }],
  tags: TAGS,
  paths: {
    '/health': { get: { tags: ['Health'], summary: 'Estado de salud de la API', responses: { 200: { description: 'API disponible' } } } },
    ...usersPaths,
    ...productsPaths,
    ...ordersPaths,
    ...deliveriesPaths,
    ...uploadsPaths,
    ...mocksPaths,
    ...loggerPaths,
  },
  components: { schemas, parameters },
});

module.exports = buildSpec;
