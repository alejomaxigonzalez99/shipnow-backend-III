const express = require('express');
const config = require('./config/env.config');
const productRoutes = require('./routes/product.routes');
const userRoutes = require('./routes/user.routes');
const { HTTP_STATUS } = require('./constants');

const app = express();

app.use(express.json());

app.use('/api/products', productRoutes);
app.use('/api/users', userRoutes);

app.use((req, res) => {
  res.status(HTTP_STATUS.NOT_FOUND).json({ status: 'error', message: 'Ruta no encontrada' });
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  let statusCode = err.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
  let message = err.message;

  if (err.name === 'ValidationError') statusCode = HTTP_STATUS.BAD_REQUEST;
  if (err.name === 'CastError') {
    statusCode = HTTP_STATUS.BAD_REQUEST;
    message = 'ID inválido';
  }

  if (statusCode === HTTP_STATUS.INTERNAL_SERVER_ERROR && config.IS_PRODUCTION) {
    message = 'Error interno del servidor';
  }

  res.status(statusCode).json({ status: 'error', message });
});

module.exports = app;
