# ShipNow API

API REST de ShipNow desarrollada con Node.js, Express y MongoDB. Implementa una arquitectura por capas **Controller → Service → Repository**, configuración de entorno centralizada, manejo global de errores, logging con Winston, documentación OpenAPI/Swagger, carga de archivos, pruebas automatizadas y despliegue con Docker Compose.

## Requisitos

- Node.js >= 18.
- npm.
- MongoDB local, Atlas o mediante Docker Compose.
- Docker Desktop y Docker Compose v2 (para ejecutar con contenedores).

## Cómo correr el proyecto localmente

### 1. Clonar e instalar dependencias

```bash
git clone <URL_DEL_REPOSITORIO>
cd shipnow
npm install
```

### 2. Configurar variables de entorno

Copiá el archivo de ejemplo:

```bash
cp .env.example .env
```

Configurá las variables:

```env
PORT=3000
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/shipnow
LOG_LEVEL=debug
TRACKING_SERVICE_URL=
NOTIFICATIONS_SERVICE_URL=
```

La aplicación valida las variables necesarias antes de iniciar. Si falta una variable obligatoria o tiene un valor inválido, el proceso no arranca y muestra un error.

### 3. Iniciar la aplicación

```bash
npm run dev
```

Para iniciar sin nodemon:

```bash
npm start
```

Por defecto, la API queda disponible en:

- API: `http://localhost:3000`
- Health check: `http://localhost:3000/health`
- Swagger: `http://localhost:3000/api/docs/`

El puerto puede modificarse mediante `PORT`.

---

## Arquitectura y estructura del proyecto

La aplicación utiliza una arquitectura por capas para separar responsabilidades y evitar que la lógica de negocio dependa directamente de Express o Mongoose.

```text
src/
├── config/
│   ├── env.config.js        # Configuración y validación de variables de entorno
│   ├── db.config.js         # Conexión a MongoDB
│   ├── logger.config.js     # Configuración centralizada de Winston
│   └── upload.config.js     # Configuración de Multer y almacenamiento
│
├── constants/
│   └── index.js             # Roles, estados, prioridades y constantes
│
├── models/                  # Esquemas Mongoose
│   ├── user.model.js
│   ├── product.model.js
│   ├── order.model.js
│   └── delivery.model.js
│
├── repositories/            # Acceso a datos mediante Mongoose
├── services/                # Lógica y reglas de negocio
├── controllers/             # Manejo de req/res y códigos HTTP
├── routes/                  # Definición y asociación de rutas
│
├── middlewares/             # Errores, requests y asyncHandler
├── errors/                  # Errores de dominio y diccionario
│
├── docs/                    # Documentación OpenAPI/Swagger
│   ├── components/
│   ├── paths/
│   ├── swagger.config.js
│   └── index.js
│
├── utils/                   # Funciones auxiliares
├── app.js                   # Configuración de Express
└── server.js                # Punto de entrada
│
tests/                       # Pruebas automatizadas
logs/                        # Archivos de logging
uploads/                     # Archivos cargados por los usuarios
```

### Responsabilidades de cada capa

| Capa | Responsabilidad |
|---|---|
| Router | Define endpoints y conecta middleware con controladores |
| Controller | Recibe solicitudes HTTP y devuelve respuestas |
| Service | Implementa validaciones y reglas de negocio |
| Repository | Centraliza las operaciones de persistencia |
| Model | Define esquemas y validaciones de Mongoose |

Los routers no realizan consultas a la base de datos. Los controladores no contienen lógica de persistencia y los servicios delegan el acceso a datos a los repositorios.

---

## Endpoints de la API

### Productos

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/products` | Lista productos disponibles |
| GET | `/api/products?includeOutOfStock=true` | Incluye productos sin stock |
| GET | `/api/products/:id` | Obtiene un producto |
| POST | `/api/products` | Crea un producto |
| PUT | `/api/products/:id` | Actualiza un producto |
| DELETE | `/api/products/:id` | Elimina un producto |

Los productos utilizan los estados `AVAILABLE`, `OUT_OF_STOCK` y `DISCONTINUED`. El estado se actualiza según las reglas de stock definidas en el servicio.

### Usuarios

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/users` | Lista usuarios |
| GET | `/api/users/:id` | Obtiene un usuario |
| POST | `/api/users` | Crea un usuario |
| PUT | `/api/users/:id` | Actualiza un usuario |
| DELETE | `/api/users/:id` | Elimina un usuario |
| POST | `/api/users/:id/documents` | Carga un documento |

El password se almacena utilizando bcrypt y no se devuelve en las respuestas de listado ni creación.

Los roles disponibles son `ADMIN`, `CUSTOMER` y `COURIER`.

### Pedidos

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/orders` | Lista pedidos |
| GET | `/api/orders?status=PENDING` | Filtra pedidos por estado |
| GET | `/api/orders?page=1&limit=10` | Lista pedidos con paginación |
| GET | `/api/orders/:id` | Obtiene un pedido |
| POST | `/api/orders` | Crea un pedido |
| PATCH | `/api/orders/:id/status` | Actualiza el estado |

El total del pedido se calcula en el servidor a partir de sus productos y cantidades.

El cambio de estado respeta las transiciones permitidas por las reglas de negocio.

### Entregas

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/deliveries` | Lista entregas |
| GET | `/api/deliveries?status=PENDING` | Filtra entregas por estado |
| GET | `/api/deliveries?page=1&limit=10` | Lista entregas con paginación |
| GET | `/api/deliveries/:id` | Obtiene una entrega |
| PATCH | `/api/deliveries/:id/courier` | Asigna un repartidor |
| PATCH | `/api/deliveries/:id/status` | Actualiza el estado |
| POST | `/api/deliveries/:id/receipt` | Carga un comprobante |

Para asignar un repartidor:

```json
{
  "courier": "ID_DEL_USUARIO"
}
```

El usuario indicado debe existir y tener el rol `COURIER`.

Los estados de entrega son:

- `PENDING`
- `ASSIGNED`
- `IN_TRANSIT`
- `DELIVERED`
- `FAILED`

Las transiciones de estado están controladas por el servicio. Para pasar a `ASSIGNED`, `IN_TRANSIT` o `DELIVERED` es necesario que exista un repartidor asignado.

---

## Mocking y carga de datos de prueba

El módulo de mocks utiliza `@faker-js/faker`, con configuración regional en español, y genera datos coherentes con los modelos y las constantes del proyecto.

### Datos generados

| Entidad | Descripción |
|---|---|
| Usuarios | Usuarios con email único y roles válidos |
| Repartidores | Usuarios con rol `COURIER` |
| Pedidos | Asociados a usuarios y con estados y prioridades válidos |
| Entregas | Asociadas a pedidos y repartidores según corresponda |

El parámetro `qty` es opcional:

- Valor por defecto: `10`.
- Mínimo: `1`.
- Máximo: `100`.

### Endpoints que devuelven datos simulados

Estos endpoints generan datos y no los guardan en MongoDB.

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/mocks/users?qty=2` | Genera usuarios |
| GET | `/api/mocks/couriers?qty=3` | Genera repartidores |
| GET | `/api/mocks/orders?qty=5` | Genera pedidos |
| GET | `/api/mocks/deliveries?qty=5` | Genera entregas |
| GET | `/api/mocks/dataset?qty=5` | Genera un conjunto relacionado |

Ejemplo:

```bash
curl "http://localhost:3000/api/mocks/users?qty=2"
```

### Endpoints que insertan datos en MongoDB

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/api/mocks/seed/users?qty=10` | Inserta usuarios |
| POST | `/api/mocks/seed?qty=10` | Inserta un conjunto relacionado de usuarios, pedidos y entregas |

Ejemplo:

```bash
curl -X POST "http://localhost:3000/api/mocks/seed/users?qty=10"

curl -X POST "http://localhost:3000/api/mocks/seed?qty=10"
```

El seed general inserta los documentos respetando el orden de dependencias:

1. Usuarios.
2. Pedidos.
3. Entregas.

Los usuarios de prueba comparten el password `Test1234!`, almacenado con hash bcrypt.

La carga de datos está deshabilitada en producción (`NODE_ENV=production`) y responde con `403`.

Si ocurre un error durante la inserción, el servicio intenta revertir los documentos que ya había insertado.

---

## Manejo global de errores

El manejo de errores está centralizado en:

```text
src/errors/
├── app-error.js
├── domain-errors.js
├── error-dictionary.js
└── index.js
```

Los servicios detectan los problemas y lanzan errores de dominio. El middleware global interpreta esos errores y genera la respuesta HTTP correspondiente.

También se normalizan errores provenientes de Mongoose, MongoDB, JSON mal formado, Multer y el sistema de archivos.

### Formato de respuesta

Las respuestas de error utilizan una estructura uniforme:

```json
{
  "status": "error",
  "statusCode": 400,
  "error": {
    "code": "MISSING_FIELDS",
    "message": "Faltan campos obligatorios",
    "details": {
      "fields": ["name", "price"]
    }
  },
  "path": "/api/products",
  "timestamp": "2026-11-14T15:27:36.959Z"
}
```

Los campos `details` aparecen cuando corresponde.

En producción, los errores internos 5xx no exponen información sensible ni detalles de implementación al cliente. La información técnica queda registrada en los logs.

### Principales códigos de error

| Código | HTTP | Descripción |
|---|---:|---|
| `VALIDATION_ERROR` | 400 | Datos que no cumplen las validaciones |
| `MISSING_FIELDS` | 400 | Faltan campos obligatorios |
| `INVALID_ID` | 400 | Identificador inválido |
| `INVALID_JSON` | 400 | JSON mal formado |
| `INVALID_ROLE` | 400 | Rol no permitido |
| `INVALID_STATUS` | 400 | Estado no permitido |
| `INVALID_COURIER` | 400 | El usuario no tiene rol `COURIER` |
| `INVALID_STATUS_TRANSITION` | 409 | Transición de estado no permitida |
| `DELIVERY_COURIER_REQUIRED` | 409 | Se necesita un repartidor asignado |
| `ROUTE_NOT_FOUND` | 404 | Ruta inexistente |
| `USER_NOT_FOUND` | 404 | Usuario inexistente |
| `PRODUCT_NOT_FOUND` | 404 | Producto inexistente |
| `ORDER_NOT_FOUND` | 404 | Pedido inexistente |
| `DELIVERY_NOT_FOUND` | 404 | Entrega inexistente |
| `EMAIL_ALREADY_EXISTS` | 409 | Email duplicado |
| `DUPLICATE_KEY` | 409 | Valor único duplicado |
| `MOCK_QTY_INVALID` | 400 | Cantidad inválida en mocks |
| `MOCK_SEED_FORBIDDEN` | 403 | Seed deshabilitado en producción |
| `MOCK_SEED_FAILED` | 500 | Error durante la inserción de mocks |
| `DATABASE_UNAVAILABLE` | 503 | Base de datos no disponible |
| `INTERNAL_ERROR` | 500 | Error interno inesperado |

---

## Logging y monitoreo

El proyecto utiliza Winston y `winston-daily-rotate-file`.

La configuración está centralizada en:

```text
src/config/logger.config.js
```

Ejemplo de uso:

```js
const logger = require('../config/logger.config');

logger.info('Pedido creado');
logger.warning('Pedido sin repartidor asignado');
logger.error('Error inesperado');
```

### Niveles de logging

De mayor a menor severidad:

`fatal` > `error` > `warning` > `info` > `http` > `debug`

| Nivel | Uso |
|---|---|
| `fatal` | Fallas críticas que provocan la terminación del proceso |
| `error` | Errores inesperados del servidor |
| `warning` | Errores esperados y problemas de negocio |
| `info` | Eventos normales de la aplicación |
| `http` | Información de solicitudes HTTP |
| `debug` | Información detallada para desarrollo |

### Comportamiento por entorno

| Entorno | Nivel | Consola | Archivos |
|---|---|---|---|
| `development` | `LOG_LEVEL` (por defecto `debug`) | Sí, con colores | Sí |
| `production` | `LOG_LEVEL` (por defecto `info`) | No | Sí |
| `test` | Silencioso | No | No |

El nivel puede configurarse mediante la variable `LOG_LEVEL`.

### Archivos generados

Los logs se guardan en la carpeta `logs/`.

| Archivo | Contenido |
|---|---|
| `error-AAAA-MM-DD.log` | Errores `error` y `fatal` |
| `combined-AAAA-MM-DD.log` | Todos los niveles activos |

La rotación genera archivos nuevos diariamente y al superar el límite de tamaño configurado. Los archivos antiguos se comprimen y se conservan durante el período configurado.

Los logs no se versionan en Git. Solo se conserva `logs/.gitkeep`.

### Endpoint de prueba

```bash
curl http://localhost:3000/api/logger/test
```

El endpoint emite mensajes de prueba para los diferentes niveles de logging.

Está disponible únicamente fuera de producción.

---

## Documentación de la API: Swagger / OpenAPI

La API utiliza OpenAPI 3.0 y `swagger-ui-express`.

### Acceso

Con el servidor iniciado:

- Swagger UI: `http://localhost:3000/api/docs/`
- Especificación OpenAPI: `http://localhost:3000/api/docs/openapi.json`

### Módulos documentados

| Tag | Contenido |
|---|---|
| Users | Listado, creación, búsqueda, actualización, eliminación y documentos |
| Products | CRUD de productos |
| Orders | Pedidos, filtros, búsqueda y actualización de estados |
| Deliveries | Entregas, asignación de repartidores, estados y comprobantes |
| Mocks | Generación e inserción de datos simulados |
| Logger | Endpoint de prueba del sistema de logging |
| Health | Estado de la aplicación |
| Uploads | Carga de archivos |

La documentación incluye parámetros, cuerpos de solicitud, respuestas exitosas, errores y esquemas reutilizables.

En producción, Swagger permanece disponible, mientras que los endpoints de mocks y logger no se montan.

### Cómo probar

1. Iniciá el servidor.
2. Abrí Swagger UI.
3. Seleccioná un endpoint.
4. Presioná **Try it out**.
5. Completá los parámetros o el body.
6. Presioná **Execute**.

Para probar pedidos y entregas, primero podés insertar datos mediante el seed en un entorno que no sea producción.

La API no implementa autenticación, por lo que no requiere un botón `Authorize`.

---

## Carga de documentos y comprobantes

El proyecto utiliza Multer para recibir archivos mediante `multipart/form-data`.

La configuración está centralizada en:

```text
src/config/upload.config.js
```

### Endpoints

| Método | Ruta | Campo de archivo | Campos adicionales |
|---|---|---|---|
| POST | `/api/users/:id/documents` | `file` | `documentType` |
| POST | `/api/deliveries/:id/receipt` | `file` | Ninguno |

Tipos de documento permitidos:

- `IDENTITY`
- `DRIVER_LICENSE`
- `OTHER`

Formatos de archivo permitidos:

- PDF
- JPG / JPEG
- PNG
- WEBP

Límite de tamaño: **5 MB**. Se admite un archivo por solicitud.

### Ejemplo: cargar documento de usuario

```bash
curl -X POST http://localhost:3000/api/users/USER_ID/documents \
  -F "file=@./dni.pdf;type=application/pdf" \
  -F "documentType=IDENTITY"
```

### Ejemplo: cargar comprobante de entrega

```bash
curl -X POST http://localhost:3000/api/deliveries/DELIVERY_ID/receipt \
  -F "file=@./comprobante.pdf;type=application/pdf"
```

### Almacenamiento

Los archivos se guardan en:

```text
uploads/
├── user-documents/
└── delivery-receipts/
```

Los nombres físicos son generados por el servidor para evitar colisiones.

MongoDB almacena los metadatos del archivo, no su contenido.

Si la entidad no existe o falla la persistencia de los metadatos, el servicio elimina el archivo recién cargado para evitar archivos huérfanos.

La carpeta `uploads/` está excluida de Git y debe persistirse mediante un volumen o almacenamiento externo en producción.

### Errores de carga

| Código | HTTP | Descripción |
|---|---:|---|
| `FILE_REQUIRED` | 400 | No se envió el archivo |
| `FILE_TYPE_INVALID` | 400 | Extensión o MIME no permitido |
| `FILE_FIELD_INVALID` | 400 | Campo incorrecto o más de un archivo |
| `DOCUMENT_TYPE_INVALID` | 400 | Tipo de documento no permitido |
| `FILE_TOO_LARGE` | 413 | Archivo mayor a 5 MB |
| `USER_NOT_FOUND` | 404 | Usuario inexistente |
| `DELIVERY_NOT_FOUND` | 404 | Entrega inexistente |
| `FILE_UPLOAD_FAILED` | 500 | Error durante la carga o persistencia |

---

## Testing funcional

Las pruebas automatizadas utilizan:

- Mocha
- Chai
- Supertest

### Ejecutar las pruebas

```bash
npm test
```

### Organización

```text
tests/
├── deliveries/
├── docs/
├── logger/
├── mocks/
├── orders/
├── products/
├── uploads/
├── users/
└── setup.js
```

| Directorio | Cobertura |
|---|---|
| `tests/users/` | Listado, creación, búsqueda y errores de usuarios |
| `tests/products/` | CRUD, stock, estados y validaciones |
| `tests/orders/` | Creación, listado, búsqueda y actualización de pedidos |
| `tests/deliveries/` | Listado, paginación, asignación de repartidores y transiciones |
| `tests/mocks/` | Generación, validación e inserción de datos simulados |
| `tests/logger/` | Endpoint de prueba de Winston |
| `tests/docs/` | Especificación OpenAPI y Swagger UI |
| `tests/uploads/` | Carga de documentos, comprobantes y validaciones |
| `tests/setup.js` | Conexión, limpieza y desconexión de MongoDB |

### Base de datos de testing

Las pruebas utilizan una base independiente llamada `shipnow_test`.

El archivo `.env.test` debe apuntar exclusivamente a esa base.

Ejemplo:

```env
PORT=3001
NODE_ENV=test
MONGODB_URI=mongodb://127.0.0.1:27017/shipnow_test
LOG_LEVEL=warning
```

El setup verifica que la conexión corresponda a `shipnow_test` antes de ejecutar las pruebas.

Antes de cada prueba se limpian las colecciones de usuarios, productos, pedidos y entregas. Después de cada prueba se eliminan los archivos de carga generados. Al finalizar, se realiza una limpieza final y se cierra la conexión.

La aplicación se importa desde `src/app.js`, sin iniciar el servidor HTTP.

### Resultado de las pruebas

Última ejecución verificada:

```text
57 passing
0 failing
```

La suite cubre los módulos principales de la API, sus respuestas exitosas, validaciones y errores.

---

## Producción, performance y Docker

### Paginación

Los endpoints de listado de usuarios, pedidos y entregas aplican paginación directamente en MongoDB.

Parámetros:

| Parámetro | Descripción | Valor por defecto |
|---|---|---|
| `page` | Página solicitada | `1` |
| `limit` | Cantidad de elementos | `50` |

El límite máximo es de 100 elementos por página.

Los listados se ordenan por `_id` descendente. Pedidos y entregas permiten filtrar por estado.

Ejemplos:

```text
GET /api/orders?page=2&limit=20&status=PENDING
GET /api/users?limit=10
GET /api/deliveries?status=IN_TRANSIT
```

### Variables de entorno

El archivo `.env.example` contiene:

```env
PORT=3000
MONGODB_URI=mongodb://127.0.0.1:27017/shipnow
NODE_ENV=development
LOG_LEVEL=debug
TRACKING_SERVICE_URL=
NOTIFICATIONS_SERVICE_URL=
```

| Variable | Descripción |
|---|---|
| `PORT` | Puerto de escucha |
| `MONGODB_URI` | URI de conexión a MongoDB |
| `NODE_ENV` | Entorno de ejecución |
| `LOG_LEVEL` | Nivel mínimo de logging |
| `TRACKING_SERVICE_URL` | URL opcional para futuras integraciones |
| `NOTIFICATIONS_SERVICE_URL` | URL opcional para futuras integraciones |

Las URLs de tracking y notificaciones son opcionales. Actualmente la aplicación no consume esos servicios.

No se requiere un secreto JWT porque esta API no implementa autenticación mediante JWT.

Nunca subas `.env`, `.env.test`, credenciales ni cadenas de conexión al repositorio.

### Docker

El proyecto incluye:

- `Dockerfile` multi-stage.
- Imagen basada en Node.js 22 Alpine.
- Instalación exclusiva de dependencias de producción en la etapa final.
- Ejecución con usuario sin privilegios.
- `HEALTHCHECK` de la API.
- `.dockerignore` para excluir archivos innecesarios.
- `docker-compose.yml` con API y MongoDB.
- Volumen persistente para los datos de MongoDB.
- Health check de MongoDB y espera de disponibilidad antes de iniciar la API.

#### Iniciar con Docker Compose

Desde la raíz del proyecto:

```bash
docker compose up -d --build
```

Este comando construye la imagen e inicia MongoDB y la API.

El servicio de la API utiliza el puerto interno `8080`. El puerto publicado en el equipo se configura mediante `PORT` o utiliza `8080` por defecto.

Si tenés `PORT=3000` en tu `.env`, la API estará disponible desde el equipo en el puerto 3000.

#### Verificar los contenedores

```bash
docker compose ps
```

Ambos servicios deben alcanzar el estado `healthy`.

#### Consultar los logs

```bash
docker compose logs -f api
```

Para consultar MongoDB:

```bash
docker compose logs -f mongodb
```

#### Probar la API

Si el puerto publicado es 8080:

```bash
curl http://localhost:8080/health
curl http://localhost:8080/api/docs/openapi.json
curl http://localhost:8080/api/products
```

Si configuraste `PORT=3000`, reemplazá `8080` por `3000`.

#### Detener los servicios

```bash
docker compose down
```

Este comando detiene y elimina los contenedores, pero conserva el volumen de datos de MongoDB.

No utilices `docker compose down -v` salvo que quieras eliminar también los datos persistidos.

### Persistencia de archivos y logs

Docker Compose monta las carpetas locales:

```text
./uploads  → /app/uploads
./logs     → /app/logs
```

De esta manera, los archivos cargados y los logs se conservan fuera del ciclo de vida del contenedor.

Para producción se recomienda utilizar almacenamiento persistente o un servicio externo de archivos y centralizar la recolección de logs según la infraestructura de despliegue.

### Endpoints internos y health check

El endpoint:

```text
GET /health
```

informa el estado de la aplicación, el entorno, el uptime y el timestamp sin exponer credenciales ni información sensible de configuración.

En `NODE_ENV=production`:

- Swagger permanece disponible.
- `/api/mocks/*` no se monta.
- `/api/logger/test` no se monta.
- El seed de datos está deshabilitado.

---

## Decisiones de diseño

### Separación Service y Repository

**Repository**

Es la única capa que conoce Mongoose y se ocupa de las operaciones de persistencia.

**Service**

Contiene las reglas de negocio y validaciones. No depende de Express ni responde directamente solicitudes HTTP.

**Controller**

Traduce las solicitudes HTTP en llamadas a los servicios y construye las respuestas.

Esta separación facilita el mantenimiento, las pruebas y la posibilidad de modificar la persistencia sin afectar la lógica de negocio.

### Limpieza y consistencia

- `process.env` se centraliza en `src/config/env.config.js`.
- Los estados, roles y códigos HTTP se definen mediante constantes.
- Los modelos se encargan de definir los esquemas de Mongoose.
- Los errores se procesan mediante un middleware global.
- Los logs se centralizan mediante Winston.
- Las consultas a MongoDB se delegan a los repositorios.
- Las carpetas de dependencias, archivos temporales, logs, uploads y coverage no se versionan.

## Archivos excluidos del repositorio

El proyecto utiliza `.gitignore` y `.dockerignore` para evitar incluir archivos innecesarios o sensibles.

Entre los archivos y directorios excluidos se encuentran:

- `node_modules/`
- `.env`
- `.env.test`
- `logs/` (excepto `.gitkeep`)
- `uploads/`
- `coverage/`
- `.nyc_output/`
- Archivos temporales
- `.git/` en la imagen Docker

El repositorio incluye `.env.example` para facilitar la configuración inicial.

---

**ShipNow API** — Node.js · Express · MongoDB · Mongoose · Winston · Swagger · Multer · Mocha · Chai · Supertest · Docker