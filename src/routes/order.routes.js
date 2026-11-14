const { Router } = require('express');
const OrderController = require('../controllers/order.controller');

const router = Router();

router.get('/', OrderController.getAll);
router.get('/:id', OrderController.getById);
router.post('/', OrderController.create);
router.patch('/:id/status', OrderController.updateStatus);

module.exports = router;
