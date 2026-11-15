const mongoose = require('mongoose');
const config = require('../src/config/env.config');

const User = require('../src/models/user.model');
const Product = require('../src/models/product.model');
const Order = require('../src/models/order.model');
const Delivery = require('../src/models/delivery.model');

const models = [User, Product, Order, Delivery];

exports.mochaHooks = {
  beforeAll: async function () {
    const uri = new URL(config.MONGODB_URI);
    const database = decodeURIComponent(uri.pathname.slice(1));

    if (config.NODE_ENV !== 'test' || database !== 'shipnow_test') {
      throw new Error('Testing cancelado: la conexión no apunta a shipnow_test');
    }

    await mongoose.connect(config.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
    });
  },

  beforeEach: async function () {
    await Promise.all(models.map((model) => model.deleteMany({})));
  },

  afterAll: async function () {
    if (mongoose.connection.readyState === 1) {
      await Promise.all(models.map((model) => model.deleteMany({})));
      await mongoose.disconnect();
    }
  },
};
