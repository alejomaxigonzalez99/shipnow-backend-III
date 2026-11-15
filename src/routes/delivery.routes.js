const { Router } = require('express');
const DeliveryController = require('../controllers/delivery.controller');
const { upload, setUploadCategory } = require('../config/upload.config');

const router = Router();

router.get('/', DeliveryController.getAll);
router.post('/:id/receipt', setUploadCategory('delivery-receipts'), upload.single('file'), DeliveryController.uploadReceipt);
router.get('/:id', DeliveryController.getById);
router.patch('/:id/courier', DeliveryController.assignCourier);
router.patch('/:id/status', DeliveryController.updateStatus);

module.exports = router;
