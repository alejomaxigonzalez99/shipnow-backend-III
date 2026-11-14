# ShipNow API

API REST de ShipNow refactorizada a una arquitectura por capas **Controller → Service → Repository**, con configuración de entorno centralizada y validada.

## Requisitos

- Node.js >= 18
- Una instancia de MongoDB (local o Atlas)

## Cómo correr el proyecto localmente

```bash
# 1. Clonar e instalar dependencias
git clone <URL_DEL_REPOSITORIO>
cd shipnow
npm install

# 2. Configurar variables de entorno
cp .env.example .env
# Editar .env y completar los valores, por ejemplo:
# PORT=3000
# MONGODB_URI=mongodb://127.0.0.1:27017/shipnow
# NODE_ENV=development

# 3. Iniciar
npm run dev     # modo desarrollo (reinicia con cambios)
npm start       # modo normal
```

Si falta alguna variable (`PORT`, `MONGODB_URI` o `NODE_ENV`), la app **no arranca** y muestra un error claro indicando cuáles faltan.

## Estructura

```
src/
├── config/
│   ├── env.config.js        # Único lugar que lee process.env (valida y exporta config)
│   ├── db.config.js         # Conexión a MongoDB
│   └── logger.config.js     # Logger Winston centralizado (niveles, formato, archivos, rotación)
├── constants/index.js       # Objetos congelados: roles, estados y prioridades de pedido/entrega, HTTP_STATUS, límites de mocks
├── models/                  # Solo esquemas Mongoose (User, Product, Order, Delivery)
├── errors/                  # Errores de dominio + diccionario de errores
├── middlewares/             # Manejador global de errores, logger de requests y asyncHandler
├── repositories/            # Acceso a datos (única capa que usa los modelos)
├── services/                # Lógica de negocio (incluye mock.service.js)
├── controllers/             # Manejo de req/res y status codes
├── routes/                  # Solo mapean rutas → métodos del controller (incluye /api/orders, /api/mocks y /api/logger)
├── utils/                   # Utilidades (generación de ObjectId)
├── app.js                   # Express, rutas y middleware de errores
└── server.js                # Punto de entrada
logs/                        # Archivos de log generados (ignorados por Git, solo se versiona .gitkeep)
```

## Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/products` | Lista productos con stock (`?includeOutOfStock=true` incluye los agotados) |
| GET | `/api/products/:id` | Detalle de un producto |
| POST | `/api/products` | Crear producto |
| PUT | `/api/products/:id` | Actualizar producto |
| DELETE | `/api/products/:id` | Eliminar producto |
| GET/POST/PUT/DELETE | `/api/users[/:id]` | CRUD de usuarios (el password nunca se devuelve) |
| GET | `/api/orders?status=PENDING` | Lista pedidos (filtro opcional por estado) |
| GET | `/api/orders/:id` | Detalle de un pedido |
| POST | `/api/orders` | Crea un pedido (`user`, `items[]`, `shippingAddress`, `priority` opcional); el total se calcula en el servidor |
| PATCH | `/api/orders/:id/status` | Cambia el estado (body `{ "status": "CONFIRMED" }`); solo transiciones válidas |
| GET | `/api/logger/test` | Herramienta interna: emite un log por cada nivel (ver *Logging*) |

## Mocking y carga de datos de prueba (`/api/mocks`)

El módulo genera datos simulados con [`@faker-js/faker`](https://fakerjs.dev) (locale español) respetando los modelos reales y las constantes del proyecto.

**Datos que se pueden generar**

| Entidad | Detalle |
|---------|---------|
| Usuarios | `name`, `email` (`@test.com`, único), `role` ∈ `USER_ROLES` (`ADMIN`, `CUSTOMER`, `COURIER`) |
| Repartidores | Usuarios con rol `COURIER` |
| Pedidos | Pertenecen a un usuario con rol `CUSTOMER`; `status` ∈ `ORDER_STATUS`, `priority` ∈ `ORDER_PRIORITY`, `items` y `total` coherentes |
| Entregas | Asociadas a un pedido. Solo se crean para pedidos `CONFIRMED`, `IN_TRANSIT` o `DELIVERED`. Si la entrega está `ASSIGNED`, `IN_TRANSIT` o `DELIVERED` lleva un repartidor (`COURIER`); si está `PENDING`, `courier` es `null` |

`qty` es opcional (por defecto 10, mínimo 1, máximo 100). Un valor inválido responde `400`.

### Endpoints que devuelven datos simulados (NO guardan en la base)

| Método | Ruta | Respuesta |
|--------|------|-----------|
| GET | `/api/mocks/users?qty=2` | Array de usuarios con roles variados |
| GET | `/api/mocks/couriers?qty=3` | Array de repartidores |
| GET | `/api/mocks/orders?qty=5` | Array de pedidos |
| GET | `/api/mocks/deliveries?qty=5` | Array de entregas |
| GET | `/api/mocks/dataset?qty=5` | `{ users, orders, deliveries }` relacionados entre sí |

Ejemplo:

```bash
curl "http://localhost:3000/api/mocks/users?qty=2"
```

```json
[
  { "_id": "6af7...", "name": "Benjamín Cuellar", "email": "benjamin.cuellar.xkhqr@test.com", "role": "CUSTOMER" },
  { "_id": "6af7...", "name": "María José Flórez", "email": "mariajose.florez.i2bfn@test.com", "role": "COURIER" }
]
```

> Los campos siguen los modelos reales (`name`, `email`, `role`), con los valores de `USER_ROLES`. Los endpoints `orders` y `deliveries` generan internamente un dataset coherente y devuelven solo esa parte; usá `/dataset` para ver todas las relaciones juntas.

### Endpoints que insertan en MongoDB

| Método | Ruta | Qué hace |
|--------|------|----------|
| POST | `/api/mocks/seed/users?qty=10` | Inserta `qty` usuarios |
| POST | `/api/mocks/seed?qty=10` | Inserta un conjunto relacionado: `qty` clientes + `ceil(qty/3)` repartidores, `qty` pedidos y las entregas que correspondan |

```bash
curl -X POST "http://localhost:3000/api/mocks/seed/users?qty=10"
# 201 → { "insertados": 10, "coleccion": "usuarios" }

curl -X POST "http://localhost:3000/api/mocks/seed?qty=10"
# 201 → { "insertados": 27, "colecciones": { "usuarios": 14, "pedidos": 10, "entregas": 3 }, "passwordDePrueba": "Test1234!" }
```

- Se inserta en orden de dependencias: usuarios → pedidos → entregas, así las referencias (`order.user`, `delivery.order`, `delivery.courier`) siempre apuntan a documentos existentes.
- Todos los usuarios de prueba comparten el password `Test1234!` (guardado con hash bcrypt).
- La carga está **deshabilitada con `NODE_ENV=production`** (responde `403`).
- Cada llamada a `/seed` agrega datos nuevos (no borra nada). Para limpiar, vaciá las colecciones `users`, `orders` y `deliveries` desde MongoDB Compass o `mongosh`.

### Cómo se reparte el mocking entre capas

- **Router** (`mock.routes.js`): solo mapea rutas.
- **Controller** (`mock.controller.js`): lee `qty`, llama al service y responde con el status.
- **Service** (`mock.service.js`): valida `qty`, genera los datos con las constantes y arma las relaciones.
- **Repository** (`*.repository.js`): `insertMany` en cada entidad; es lo único que toca Mongoose en la carga.

## Manejo de errores

Todo el manejo de errores está centralizado. Cada capa tiene un rol:

- **Service**: detecta el problema y lanza un error de dominio (`throw new UserNotFoundError(id)`). Es donde se decide *qué* salió mal.
- **Controller / Router**: no responden errores. Los handlers van envueltos en `asyncHandler`, que deriva cualquier error al middleware global.
- **Middleware global** (`src/middlewares/error.middleware.js`): es el **único** lugar que escribe una respuesta de error. También traduce errores de librerías (Mongoose, JSON inválido, índices únicos, base caída) a errores de la app.

```
src/errors/
├── error-dictionary.js   # ERROR_CODES + diccionario código → { status HTTP, mensaje por defecto }
├── app-error.js          # Clase base AppError (toma status y mensaje del diccionario)
├── domain-errors.js      # UserNotFoundError, OrderNotFoundError, InvalidStatusError, InvalidMockQtyError, MockSeedError, ...
└── index.js
```

### Estructura de la respuesta de error

Todos los errores responden con **exactamente** esta forma:

```json
{
  "status": "error",
  "statusCode": 400,
  "error": {
    "code": "MOCK_QTY_INVALID",
    "message": "qty inválida (NEGATIVE): se recibió \"-5\". Debe ser un entero entre 1 y 100",
    "details": { "reason": "NEGATIVE", "received": "-5", "min": 1, "max": 100 }
  },
  "path": "/api/mocks/users?qty=-5",
  "timestamp": "2026-11-14T15:27:36.959Z"
}
```

- `error.code`: identificador estable pensado para que el cliente decida qué hacer (no cambia aunque cambie el texto).
- `error.message`: texto legible.
- `error.details`: datos extra, solo cuando aplican (campos inválidos, valores permitidos, etc.).
- En `NODE_ENV=production`, los errores 5xx **no** exponen mensaje interno ni `details`: se muestra el mensaje genérico del diccionario y el error real queda en el log del servidor.

### Diccionario de errores

| Código | HTTP | Cuándo |
|--------|------|--------|
| `VALIDATION_ERROR` | 400 | Datos que no cumplen reglas (precio/stock negativos, esquema Mongoose) |
| `MISSING_FIELDS` | 400 | Faltan campos obligatorios |
| `INVALID_ID` | 400 | ID con formato inválido |
| `INVALID_JSON` | 400 | Body con JSON mal formado |
| `INVALID_ROLE` | 400 | Rol fuera de `USER_ROLES` |
| `INVALID_STATUS` | 400 | Estado fuera de los permitidos |
| `INVALID_STATUS_TRANSITION` | 409 | Cambio de estado de pedido no permitido (ej. `PENDING` → `DELIVERED`) |
| `ROUTE_NOT_FOUND` | 404 | La ruta no existe |
| `USER_NOT_FOUND` / `PRODUCT_NOT_FOUND` / `ORDER_NOT_FOUND` | 404 | El recurso no existe |
| `EMAIL_ALREADY_EXISTS` / `DUPLICATE_KEY` | 409 | Dato único repetido |
| `MOCK_QTY_INVALID` | 400 | `qty` inválida en mocks (ver abajo) |
| `MOCK_SEED_FORBIDDEN` | 403 | Seed deshabilitado en producción |
| `MOCK_SEED_FAILED` | 500 | Falló la inserción en MongoDB durante el seed |
| `DATABASE_UNAVAILABLE` | 503 | No hay conexión con MongoDB |
| `INTERNAL_ERROR` | 500 | Error inesperado |

### Errores del módulo de mocks

`qty` se valida en `MockService.parseQty` (default 10, rango 1–100). `details.reason` indica el motivo:

| Caso | Ejemplo | `details.reason` |
|------|---------|------------------|
| Negativa | `?qty=-5` | `NEGATIVE` |
| Fuera de rango | `?qty=0`, `?qty=101` | `OUT_OF_RANGE` |
| No numérica / vacía / repetida | `?qty=abc`, `?qty=`, `?qty=1&qty=2` | `NOT_A_NUMBER` |
| Decimal | `?qty=2.5` | `NOT_INTEGER` |

**Falla durante la carga en MongoDB:** el seed inserta por etapas (usuarios → pedidos → entregas). Si una falla (por ejemplo, un email duplicado), se **revierte** lo que ya se había insertado y se responde `500 MOCK_SEED_FAILED` con `details: { collection, rolledBack, reason }` (`reason` solo fuera de producción; `rolledBack: false` si el propio rollback falló).

### Cómo probar los casos inválidos

Con la app corriendo (`npm run dev`, puerto 3000 en los ejemplos):

```bash
# --- Mocks ---
curl -i "localhost:3000/api/mocks/users?qty=-5"          # 400 MOCK_QTY_INVALID (NEGATIVE)
curl -i "localhost:3000/api/mocks/users?qty=0"           # 400 MOCK_QTY_INVALID (OUT_OF_RANGE)
curl -i "localhost:3000/api/mocks/orders?qty=101"        # 400 MOCK_QTY_INVALID (OUT_OF_RANGE)
curl -i "localhost:3000/api/mocks/couriers?qty=abc"      # 400 MOCK_QTY_INVALID (NOT_A_NUMBER)
curl -i "localhost:3000/api/mocks/deliveries?qty=2.5"    # 400 MOCK_QTY_INVALID (NOT_INTEGER)
curl -i -X POST "localhost:3000/api/mocks/seed?qty=-1"   # 400, no toca la base

# Falla de carga (MOCK_SEED_FAILED): con la app ya conectada, detené MongoDB y ejecutá:
curl -i -X POST "localhost:3000/api/mocks/seed?qty=5"    # 500 MOCK_SEED_FAILED (rolledBack: false, no se pudo revertir)
# Con MongoDB detenido, los demás endpoints que usan la base (ej. GET /api/products)
# responden 503 DATABASE_UNAVAILABLE.

# Seed en producción: arrancá con NODE_ENV=production
curl -i -X POST "localhost:3000/api/mocks/seed?qty=5"    # 403 MOCK_SEED_FORBIDDEN

# --- Resto de la API ---
curl -i localhost:3000/api/nada                                              # 404 ROUTE_NOT_FOUND
curl -i -X POST localhost:3000/api/products -H "Content-Type: application/json" -d '{"name":'   # 400 INVALID_JSON
curl -i -X POST localhost:3000/api/products -H "Content-Type: application/json" -d '{}'          # 400 MISSING_FIELDS
curl -i -X POST localhost:3000/api/products -H "Content-Type: application/json" -d '{"name":"a","price":-1}'   # 400 VALIDATION_ERROR
curl -i localhost:3000/api/users/64b000000000000000000000                    # 404 USER_NOT_FOUND
curl -i localhost:3000/api/users/abc                                         # 400 INVALID_ID
curl -i localhost:3000/api/orders/64b000000000000000000000                   # 404 ORDER_NOT_FOUND
curl -i "localhost:3000/api/orders?status=XX"                                # 400 INVALID_STATUS
```

Para probar `EMAIL_ALREADY_EXISTS` creá el mismo usuario dos veces (`POST /api/users`), y para `INVALID_STATUS_TRANSITION` primero generá datos con `POST /api/mocks/seed?qty=10`, tomá el `_id` de un pedido `PENDING` con `GET /api/orders?status=PENDING` y probá `PATCH /api/orders/<id>/status` con `{"status":"DELIVERED"}`.

## Logging y monitoreo básico

Se usa [**Winston**](https://github.com/winstonjs/winston) con [`winston-daily-rotate-file`](https://github.com/winstonjs/winston-daily-rotate-file). La configuración vive en un único módulo, `src/config/logger.config.js`, y se usa desde cualquier archivo sin repetir configuración:

```js
const logger = require('../config/logger.config');
logger.info('Pedido creado');
logger.warning('Pedido sin repartidor asignado');
```

Formato de cada línea (consola y archivo): `fecha hora [nivel] mensaje`

```
2026-11-14 12:33:55 [info]    Pedido creado: 64b1... (usuario 64a0..., total 20, prioridad NORMAL)
2026-11-14 12:33:55 [warning] GET /api/nada -> 404 ROUTE_NOT_FOUND: Ruta no encontrada: GET /api/nada
2026-11-14 12:33:55 [error]   POST /api/mocks/seed?qty=3 -> 500 MOCK_SEED_FAILED: Falló la inserción en la colección "pedidos"
```

### Niveles

De más a menos severo: `fatal` > `error` > `warning` > `info` > `http` > `debug`.

| Nivel | Se usa para |
|-------|-------------|
| `fatal` | Fallas críticas: variables de entorno inválidas, no poder conectar a MongoDB al iniciar, excepciones no capturadas. El proceso termina |
| `error` | Errores inesperados del servidor (5xx), con stack trace; falla de carga de mocks |
| `warning` | Errores esperados/de negocio (4xx: pedido no encontrado, `qty` inválida, ruta inexistente), rollback de seed, conexión a MongoDB perdida |
| `info` | Eventos normales: servidor iniciado, conexión a MongoDB, pedido/usuario/producto creado, seed completado |
| `http` | Una línea por request: método, URL, status y duración |
| `debug` | Detalle de desarrollo (ej. generación de datos mock) |

### Comportamiento por entorno (`NODE_ENV`)

| Entorno | Nivel mínimo | Consola | Archivos |
|---------|--------------|---------|----------|
| `development` | `debug` (todo) | Sí, con colores | Sí |
| `production` | `info` (sin `debug` ni `http`) | Sí | Sí |
| `test` | `warning` | Sí | No |

El nivel se deriva de `NODE_ENV`, que se lee solo en `src/config/env.config.js`.

### Integración con el manejo de errores

El middleware global de errores registra cada error antes de responder: los **4xx (esperados)** como `warning` y los **5xx (inesperados)** como `error` con el stack trace. La respuesta al cliente no cambia (sigue siendo la estructura uniforme del módulo anterior). Las fallas **fatales** se registran en `server.js` (configuración inválida, conexión inicial a MongoDB, `uncaughtException`/`unhandledRejection`) y luego el proceso termina con código 1.

### Archivos de log y rotación

Se guardan en la carpeta `logs/` de la raíz del proyecto:

| Archivo | Contenido |
|---------|-----------|
| `logs/error-AAAA-MM-DD.log` | **Solo** `error` y `fatal` |
| `logs/combined-AAAA-MM-DD.log` | Todos los niveles activos del entorno |

Rotación: un archivo nuevo por día, y también si un archivo supera **10 MB**; los archivos antiguos se comprimen (`.gz`) y se conservan **14 días**.

**Git:** `.gitignore` ignora `logs/*` (y `*.log`, `node_modules/`, `.env`). Solo se versiona `logs/.gitkeep` para que la carpeta exista en el repositorio.

### Cómo probar el logger

1. Iniciá la app (`npm run dev`) y llamá al endpoint de prueba:
   ```bash
   curl localhost:3000/api/logger/test
   ```
   Emite un mensaje por cada nivel (`debug`, `http`, `info`, `warning`, `error`, `fatal`) y responde qué niveles quedaron registrados en el entorno actual.
2. Mirá la consola de la app: aparecen los 6 niveles en desarrollo, y solo `info`, `warning`, `error` y `fatal` con `NODE_ENV=production`.
3. Revisá los archivos:
   ```bash
   cat logs/error-*.log      # solo error y fatal
   cat logs/combined-*.log   # historial completo
   ```
4. Probá logs reales: `curl "localhost:3000/api/mocks/users?qty=-5"` (warning), `curl localhost:3000/api/nada` (warning), o `POST /api/orders` para ver el `info` de pedido creado.
5. Falla fatal: borrá `MONGODB_URI` del `.env` y ejecutá `npm start`; queda un `[fatal]` en consola y en `logs/error-*.log`.

## ¿Por qué separé Service y Repository?

- **Repository**: es la única capa que conoce Mongoose. Solo expone operaciones de datos (`getAll`, `getById`, `create`, ...). Si mañana cambia la base de datos o el ODM, solo se toca esta capa.
- **Service**: contiene las reglas de negocio y no sabe nada de HTTP ni de Mongoose. Ejemplos: el listado de productos oculta los que no tienen stock, el estado del producto (`AVAILABLE`/`OUT_OF_STOCK`) se calcula a partir del stock, el email de usuario debe ser único y el password se hashea con bcrypt antes de guardarse.
- **Controller**: traduce HTTP ↔ Service (lee `req`, devuelve `res` con el status correcto). No conoce la base de datos.

Esta separación hace que cada capa tenga una única responsabilidad, sea fácil de testear de forma aislada (por ejemplo, un Service se puede probar con un Repository simulado) y evita que la lógica de negocio quede mezclada con detalles de transporte o de persistencia.

## Decisiones de limpieza

- `process.env` se usa **únicamente** en `src/config/env.config.js`.
- No hay strings mágicos: estados, roles, entornos y códigos HTTP salen de `src/constants`.
- Los modelos solo definen esquema; no tienen lógica de controladores.
- Ningún controller, router ni service responde errores directamente: todo pasa por el middleware global.
- No quedan `console.log`/`console.error` en el código: todo mensaje del servidor pasa por el logger.
