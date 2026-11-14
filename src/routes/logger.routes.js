const { Router } = require('express');
const LoggerController = require('../controllers/logger.controller');

const router = Router();

// Herramienta interna: genera un log por cada nivel para validar la configuración.
router.get('/test', LoggerController.test);

module.exports = router;
