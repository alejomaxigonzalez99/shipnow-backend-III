const {
  ref, paramRef, errorResponses, successResponse, messageResponse, jsonBody,
  INTERNAL, DB_DOWN, INVALID_JSON, INVALID_ID,
} = require('../helpers');
const { OBJECT_ID_EXAMPLE } = require('../components/schemas');

const TAG = 'Users';
const userExample = {
  _id: OBJECT_ID_EXAMPLE,
  name: 'Ana Pérez',
  email: 'ana.perez@test.com',
  role: 'CUSTOMER',
  createdAt: '2026-11-14T15:00:00.000Z',
  updatedAt: '2026-11-14T15:00:00.000Z',
};
const notFound = { code: 'USER_NOT_FOUND', message: `Usuario no encontrado: ${OBJECT_ID_EXAMPLE}`, details: { id: OBJECT_ID_EXAMPLE } };

const usersPaths = {
  '/api/users': {
    get: {
      tags: [TAG],
      summary: 'Listar usuarios',
      description: 'Devuelve todos los usuarios. El password nunca se incluye.',
      operationId: 'listUsers',
      responses: {
        200: successResponse('Lista de usuarios', { type: 'array', items: ref('User') }, [userExample]),
        ...errorResponses('/api/users', [DB_DOWN, INTERNAL]),
      },
    },
    post: {
      tags: [TAG],
      summary: 'Crear usuario',
      description:
        'Crea un usuario. El email debe ser único y el password se guarda con hash bcrypt. Si no se envía `role`, queda `CUSTOMER`.',
      operationId: 'createUser',
      requestBody: jsonBody('UserCreate', { name: 'Ana Pérez', email: 'ana.perez@test.com', password: 'Secreta123', role: 'CUSTOMER' }),
      responses: {
        201: successResponse('Usuario creado (sin password)', ref('User'), userExample),
        ...errorResponses('/api/users', [
          { code: 'MISSING_FIELDS', details: { fields: ['email', 'password'] } },
          { code: 'INVALID_ROLE', message: 'Rol inválido: "jefe". Permitidos: ADMIN, CUSTOMER, COURIER', details: { received: 'jefe', allowed: ['ADMIN', 'CUSTOMER', 'COURIER'] } },
          INVALID_JSON,
          { code: 'EMAIL_ALREADY_EXISTS', details: { email: 'ana.perez@test.com' } },
          DB_DOWN,
          INTERNAL,
        ]),
      },
    },
  },
  '/api/users/{id}': {
    get: {
      tags: [TAG],
      summary: 'Obtener un usuario por ID',
      operationId: 'getUserById',
      parameters: [paramRef('Id')],
      responses: {
        200: successResponse('Usuario encontrado', ref('User'), userExample),
        ...errorResponses(`/api/users/${OBJECT_ID_EXAMPLE}`, [INVALID_ID(), notFound, DB_DOWN, INTERNAL]),
      },
    },
    put: {
      tags: [TAG],
      summary: 'Actualizar un usuario',
      description: 'Modifica solo los campos enviados. Si se envía `password`, se vuelve a hashear.',
      operationId: 'updateUser',
      parameters: [paramRef('Id')],
      requestBody: jsonBody('UserUpdate', { name: 'Ana P. Gómez', role: 'COURIER' }),
      responses: {
        200: successResponse('Usuario actualizado', ref('User'), { ...userExample, name: 'Ana P. Gómez', role: 'COURIER' }),
        ...errorResponses(`/api/users/${OBJECT_ID_EXAMPLE}`, [
          INVALID_ID(),
          { code: 'INVALID_ROLE', message: 'Rol inválido: "jefe". Permitidos: ADMIN, CUSTOMER, COURIER', details: { received: 'jefe', allowed: ['ADMIN', 'CUSTOMER', 'COURIER'] } },
          INVALID_JSON,
          notFound,
          { code: 'DUPLICATE_KEY', details: { fields: ['email'] } },
          DB_DOWN,
          INTERNAL,
        ]),
      },
    },
    delete: {
      tags: [TAG],
      summary: 'Eliminar un usuario',
      operationId: 'deleteUser',
      parameters: [paramRef('Id')],
      responses: {
        200: messageResponse('Usuario eliminado', 'Usuario eliminado'),
        ...errorResponses(`/api/users/${OBJECT_ID_EXAMPLE}`, [INVALID_ID(), notFound, DB_DOWN, INTERNAL]),
      },
    },
  },
};

module.exports = { usersPaths };
