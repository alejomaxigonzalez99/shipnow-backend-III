const mongoose = require('mongoose');
const { DELIVERY_STATUS } = require('../constants');

const deliverySchema = new mongoose.Schema(
  {
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
    courier: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    status: {
      type: String,
      enum: Object.values(DELIVERY_STATUS),
      default: DELIVERY_STATUS.PENDING,
    },
    estimatedAt: { type: Date },
    deliveredAt: { type: Date, default: null },
    receipt: {
      originalName: { type: String },
      filename: { type: String },
      path: { type: String },
      mimeType: { type: String },
      size: { type: Number, min: 1 },
      documentType: { type: String, default: 'DELIVERY_RECEIPT' },
      uploadedAt: { type: Date },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Delivery', deliverySchema);
