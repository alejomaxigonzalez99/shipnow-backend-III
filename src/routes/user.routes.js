const { Router } = require('express');
const UserController = require('../controllers/user.controller');
const { upload, setUploadCategory } = require('../config/upload.config');

const router = Router();

router.get('/', UserController.getAll);
router.post('/:id/documents', setUploadCategory('user-documents'), upload.single('file'), UserController.uploadDocument);
router.get('/:id', UserController.getById);
router.post('/', UserController.create);
router.put('/:id', UserController.update);
router.delete('/:id', UserController.delete);

module.exports = router;
