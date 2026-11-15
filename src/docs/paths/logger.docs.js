const { ref, successResponse } = require('../helpers');

const loggerPaths = {
  '/api/logger/test': {
    get: {
      tags: ['Logger'],
      summary: 'Probar el logger (herramienta interna)',
      description:
        '**Herramienta de validación de la configuración de logs; no es una funcionalidad de negocio.** Emite un mensaje por cada nivel (`debug`, `http`, `info`, `warning`, `error`, `fatal`) y responde cuáles quedaron registrados en el entorno actual. Sirve para comprobar la consola y los archivos de `logs/` (`error-*.log` solo recibe `error` y `fatal`). Ojo: genera entradas `error` y `fatal` de prueba en los logs.',
      operationId: 'testLogger',
      responses: {
        200: successResponse('Niveles emitidos', ref('LoggerTestResult'), {
          nivelMinimoActivo: 'debug',
          niveles: [
            { nivel: 'debug', registrado: true, archivoDeErrores: false },
            { nivel: 'error', registrado: true, archivoDeErrores: true },
            { nivel: 'fatal', registrado: true, archivoDeErrores: true },
          ],
          carpetaDeLogs: '/ruta/al/proyecto/logs',
        }),
      },
    },
  },
};

module.exports = { loggerPaths };
