const { Router } = require('express');
const DeliveryController = require('../controllers/delivery.controller');

const router = Router();

router.get('/', DeliveryController.getAll);
router.get('/:id', DeliveryController.getById);
router.patch('/:id/courier', DeliveryController.assignCourier);
router.patch('/:id/status', DeliveryController.updateStatus);

module.exports = router;
