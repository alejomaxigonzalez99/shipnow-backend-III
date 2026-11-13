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
├── constants/index.js       # Objetos congelados: PRODUCT_STATUS, USER_ROLES, NODE_ENVS, HTTP_STATUS
├── models/                  # Solo esquemas Mongoose
├── repositories/            # Acceso a datos (única capa que usa los modelos)
├── services/                # Lógica de negocio
├── controllers/             # Manejo de req/res y status codes
├── routes/                  # Solo mapean rutas → métodos del controller
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

## ¿Por qué separé Service y Repository?

- **Repository**: es la única capa que conoce Mongoose. Solo expone operaciones de datos (`getAll`, `getById`, `create`, ...). Si mañana cambia la base de datos o el ODM, solo se toca esta capa.
- **Service**: contiene las reglas de negocio y no sabe nada de HTTP ni de Mongoose. Ejemplos: el listado de productos oculta los que no tienen stock, el estado del producto (`AVAILABLE`/`OUT_OF_STOCK`) se calcula a partir del stock, el email de usuario debe ser único y el password se hashea con bcrypt antes de guardarse.
- **Controller**: traduce HTTP ↔ Service (lee `req`, devuelve `res` con el status correcto). No conoce la base de datos.

Esta separación hace que cada capa tenga una única responsabilidad, sea fácil de testear de forma aislada (por ejemplo, un Service se puede probar con un Repository simulado) y evita que la lógica de negocio quede mezclada con detalles de transporte o de persistencia.

## Decisiones de limpieza

- `process.env` se usa **únicamente** en `src/config/env.config.js`.
- No hay strings mágicos: estados, roles, entornos y códigos HTTP salen de `src/constants`.
- Los modelos solo definen esquema; no tienen lógica de controladores.
