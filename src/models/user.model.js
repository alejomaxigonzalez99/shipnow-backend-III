const mongoose = require('mongoose');
const { USER_ROLES, USER_DOCUMENT_TYPES } = require('../constants');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false },
    documents: [{
      originalName: { type: String, required: true },
      filename: { type: String, required: true },
      path: { type: String, required: true },
      mimeType: { type: String, required: true },
      size: { type: Number, required: true, min: 1 },
      documentType: { type: String, enum: Object.values(USER_DOCUMENT_TYPES), default: USER_DOCUMENT_TYPES.OTHER },
      uploadedAt: { type: Date, default: Date.now },
    }],
    role: {
      type: String,
      enum: Object.values(USER_ROLES),
      default: USER_ROLES.CUSTOMER,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
