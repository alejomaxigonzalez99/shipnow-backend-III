const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const logger = require('./logger.config');
const { UPLOAD_CONFIG } = require('../constants');
const { InvalidFileTypeError } = require('../errors');

const UPLOAD_ROOT = path.resolve(__dirname, '../..', 'uploads');
const CATEGORIES = new Set(['user-documents', 'delivery-receipts']);

const setUploadCategory = (category) => (req, res, next) => {
  if (!CATEGORIES.has(category)) {
    return next(new Error(`Categoría de upload no configurada: ${category}`));
  }
  req.uploadCategory = category;
  next();
};

const storage = multer.diskStorage({
  destination: (req, file, callback) => {
    const category = CATEGORIES.has(req.uploadCategory) ? req.uploadCategory : 'temporary';
    const destination = path.join(UPLOAD_ROOT, category);
    fs.mkdir(destination, { recursive: true }, (error) => callback(error, destination));
  },
  filename: (req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();
    callback(null, `${Date.now()}-${crypto.randomUUID()}${extension}`);
  },
});

const fileFilter = (req, file, callback) => {
  const extension = path.extname(file.originalname).toLowerCase();
  const allowedExtensions = UPLOAD_CONFIG.ALLOWED_MIME_TYPES[file.mimetype] || [];
  if (!allowedExtensions.includes(extension)) {
    logger.warning(`Intento de carga con tipo no permitido: ${file.mimetype} (${file.originalname})`);
    return callback(new InvalidFileTypeError(file.mimetype, extension));
  }
  callback(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: UPLOAD_CONFIG.MAX_FILE_SIZE,
    files: 1,
    fields: 5,
    parts: 6,
  },
});

const buildFileMetadata = (file, documentType) => ({
  originalName: file.originalname,
  filename: file.filename,
  path: path.relative(path.resolve(__dirname, '../..'), file.path).split(path.sep).join('/'),
  mimeType: file.mimetype,
  size: file.size,
  documentType,
  uploadedAt: new Date(),
});

module.exports = { upload, setUploadCategory, buildFileMetadata, UPLOAD_ROOT };
