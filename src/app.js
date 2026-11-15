const express = require('express');
const productRoutes = require('./routes/product.routes');
const userRoutes = require('./routes/user.routes');
const orderRoutes = require('./routes/order.routes');
const deliveryRoutes = require('./routes/delivery.routes');
const mockRoutes = require('./routes/mock.routes');
const loggerRoutes = require('./routes/logger.routes');
const docsRouter = require('./docs');
const requestLogger = require('./middlewares/request-logger.middleware');
const { errorHandler, notFoundHandler } = require('./middlewares/error.middleware');

const app = express();

app.use(express.json());
app.use(requestLogger);

app.use('/api/products', productRoutes);
app.use('/api/users', userRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/deliveries', deliveryRoutes);
app.use('/api/mocks', mockRoutes);
app.use('/api/logger', loggerRoutes);
app.use('/api/docs', docsRouter);

// Siempre al final: 404 y manejador global de errores.
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
