const config = require('./config/env.config');
const connectDB = require('./config/db.config');
const app = require('./app');

const start = async () => {
  await connectDB();
  app.listen(config.PORT, () => {
    console.log(`[server] ShipNow escuchando en el puerto ${config.PORT} (${config.NODE_ENV})`);
  });
};

start().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
