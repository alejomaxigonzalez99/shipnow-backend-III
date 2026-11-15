const { Router } = require('express');
const swaggerUi = require('swagger-ui-express');
const buildSpec = require('./swagger.config');

const spec = buildSpec();
const router = Router();

// Especificación OpenAPI en crudo (útil para importar en Postman, etc.).
router.get('/openapi.json', (req, res) => res.json(spec));

// Swagger UI interactivo.
router.use(
  '/',
  swaggerUi.serve,
  swaggerUi.setup(spec, { customSiteTitle: 'ShipNow API - Documentación' })
);

module.exports = router;
