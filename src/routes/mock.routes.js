const { Router } = require('express');
const MockController = require('../controllers/mock.controller');

const router = Router();

// Devuelven datos simulados SIN guardarlos
router.get('/users', MockController.getUsers);
router.get('/couriers', MockController.getCouriers);
router.get('/orders', MockController.getOrders);
router.get('/deliveries', MockController.getDeliveries);
router.get('/dataset', MockController.getDataset);

// Insertan datos de prueba en MongoDB
router.post('/seed', MockController.seedAll);
router.post('/seed/users', MockController.seedUsers);

module.exports = router;
