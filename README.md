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
│   └── db.config.js         # Conexión a MongoDB
├── constants/index.js       # Objetos congelados: roles, estados y prioridades de pedido/entrega, HTTP_STATUS, límites de mocks
├── models/                  # Solo esquemas Mongoose (User, Product, Order, Delivery)
├── repositories/            # Acceso a datos (única capa que usa los modelos)
├── services/                # Lógica de negocio (incluye mock.service.js)
├── controllers/             # Manejo de req/res y status codes
├── routes/                  # Solo mapean rutas → métodos del controller (incluye /api/mocks)
├── utils/app-error.js       # Error con statusCode para el manejo centralizado
├── app.js                   # Express, rutas y middleware de errores
└── server.js                # Punto de entrada
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

## ¿Por qué separé Service y Repository?

- **Repository**: es la única capa que conoce Mongoose. Solo expone operaciones de datos (`getAll`, `getById`, `create`, ...). Si mañana cambia la base de datos o el ODM, solo se toca esta capa.
- **Service**: contiene las reglas de negocio y no sabe nada de HTTP ni de Mongoose. Ejemplos: el listado de productos oculta los que no tienen stock, el estado del producto (`AVAILABLE`/`OUT_OF_STOCK`) se calcula a partir del stock, el email de usuario debe ser único y el password se hashea con bcrypt antes de guardarse.
- **Controller**: traduce HTTP ↔ Service (lee `req`, devuelve `res` con el status correcto). No conoce la base de datos.

Esta separación hace que cada capa tenga una única responsabilidad, sea fácil de testear de forma aislada (por ejemplo, un Service se puede probar con un Repository simulado) y evita que la lógica de negocio quede mezclada con detalles de transporte o de persistencia.

## Decisiones de limpieza

- `process.env` se usa **únicamente** en `src/config/env.config.js`.
- No hay strings mágicos: estados, roles, entornos y códigos HTTP salen de `src/constants`.
- Los modelos solo definen esquema; no tienen lógica de controladores.
