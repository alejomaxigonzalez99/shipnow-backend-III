const AppError = require('./app-error');
const { ERROR_CODES } = require('./error-dictionary');

// ---------- Validación ----------

class ValidationError extends AppError {
  // fields: [{ field, message }]
  constructor(fields = [], message) {
    super(ERROR_CODES.VALIDATION_ERROR, { message, details: { fields } });
  }
}

class MissingFieldsError extends AppError {
  constructor(fields) {
    super(ERROR_CODES.MISSING_FIELDS, {
      message: `Faltan campos obligatorios: ${fields.join(', ')}`,
      details: { fields },
    });
  }
}

class InvalidIdError extends AppError {
  constructor(id) {
    super(ERROR_CODES.INVALID_ID, { details: { received: id } });
  }
}

class InvalidRoleError extends AppError {
  constructor(received, allowed) {
    super(ERROR_CODES.INVALID_ROLE, {
      message: `Rol inválido: "${received}". Permitidos: ${allowed.join(', ')}`,
      details: { received, allowed },
    });
  }
}

class InvalidStatusError extends AppError {
  constructor(entity, received, allowed) {
    super(ERROR_CODES.INVALID_STATUS, {
      message: `Estado inválido para ${entity}: "${received}". Permitidos: ${allowed.join(', ')}`,
      details: { entity, received, allowed },
    });
  }
}

class InvalidStatusTransitionError extends AppError {
  constructor(entity, from, to, allowed) {
    super(ERROR_CODES.INVALID_STATUS_TRANSITION, {
      message: `No se puede pasar ${entity} de ${from} a ${to}`,
      details: { entity, from, to, allowed },
    });
  }
}

class InvalidCourierError extends AppError {
  constructor(userId, role) {
    super(ERROR_CODES.INVALID_COURIER, {
      message: `El usuario ${userId} tiene rol ${role}; debe tener rol COURIER`,
      details: { userId, role },
    });
  }
}

class DeliveryCourierRequiredError extends AppError {
  constructor(id, status) {
    super(ERROR_CODES.DELIVERY_COURIER_REQUIRED, {
      message: `La entrega ${id} no tiene repartidor: asignalo antes de pasarla a ${status}`,
      details: { id, status },
    });
  }
}

// ---------- No encontrado ----------

class RouteNotFoundError extends AppError {
  constructor(method, path) {
    super(ERROR_CODES.ROUTE_NOT_FOUND, {
      message: `Ruta no encontrada: ${method} ${path}`,
    });
  }
}

class DeliveryNotFoundError extends AppError {
  constructor(id) {
    super(ERROR_CODES.DELIVERY_NOT_FOUND, { message: `Entrega no encontrada: ${id}`, details: { id } });
  }
}

class UserNotFoundError extends AppError {
  constructor(id) {
    super(ERROR_CODES.USER_NOT_FOUND, { message: `Usuario no encontrado: ${id}`, details: { id } });
  }
}

class ProductNotFoundError extends AppError {
  constructor(id) {
    super(ERROR_CODES.PRODUCT_NOT_FOUND, { message: `Producto no encontrado: ${id}`, details: { id } });
  }
}

class OrderNotFoundError extends AppError {
  constructor(id) {
    super(ERROR_CODES.ORDER_NOT_FOUND, { message: `Pedido no encontrado: ${id}`, details: { id } });
  }
}

// ---------- Conflictos ----------

class EmailAlreadyExistsError extends AppError {
  constructor(email) {
    super(ERROR_CODES.EMAIL_ALREADY_EXISTS, { details: { email } });
  }
}

// ---------- Mocks ----------

class InvalidMockQtyError extends AppError {
  // reason ∈ MOCK_QTY_REASONS
  constructor(reason, received, { min, max }) {
    super(ERROR_CODES.MOCK_QTY_INVALID, {
      message: `qty inválida (${reason}): se recibió ${JSON.stringify(received)}. Debe ser un entero entre ${min} y ${max}`,
      details: { reason, received, min, max },
    });
  }
}

class MockSeedForbiddenError extends AppError {
  constructor() {
    super(ERROR_CODES.MOCK_SEED_FORBIDDEN);
  }
}

class MockSeedError extends AppError {
  constructor({ collection, rolledBack, reason, cause }) {
    super(ERROR_CODES.MOCK_SEED_FAILED, {
      message: `Falló la inserción en la colección "${collection}"`,
      details: { collection, rolledBack, ...(reason ? { reason } : {}) },
      cause,
    });
  }
}


class FileRequiredError extends AppError {
  constructor() { super(ERROR_CODES.FILE_REQUIRED); }
}
class InvalidFileTypeError extends AppError {
  constructor(mimeType, extension) {
    super(ERROR_CODES.FILE_TYPE_INVALID, {
      message: `Tipo de archivo no permitido: ${mimeType || 'desconocido'} (${extension || 'sin extensión'})`,
      details: { mimeType, extension },
    });
  }
}
class FileTooLargeError extends AppError {
  constructor(maxBytes) {
    super(ERROR_CODES.FILE_TOO_LARGE, { details: { maxBytes } });
  }
}
class InvalidFileFieldError extends AppError {
  constructor(field) {
    super(ERROR_CODES.FILE_FIELD_INVALID, { details: { received: field, expected: 'file' } });
  }
}
class InvalidDocumentTypeError extends AppError {
  constructor(received, allowed) {
    super(ERROR_CODES.DOCUMENT_TYPE_INVALID, {
      message: `Tipo de documento inválido: "${received}". Permitidos: ${allowed.join(', ')}`,
      details: { received, allowed },
    });
  }
}
class FileUploadFailedError extends AppError {
  constructor(cause) { super(ERROR_CODES.FILE_UPLOAD_FAILED, { cause }); }
}

module.exports = {
  ValidationError,
  MissingFieldsError,
  InvalidIdError,
  InvalidRoleError,
  InvalidStatusError,
  InvalidStatusTransitionError,
  InvalidCourierError,
  DeliveryCourierRequiredError,
  DeliveryNotFoundError,
  RouteNotFoundError,
  UserNotFoundError,
  ProductNotFoundError,
  OrderNotFoundError,
  EmailAlreadyExistsError,
  InvalidMockQtyError,
  MockSeedForbiddenError,
  MockSeedError,
  FileRequiredError,
  InvalidFileTypeError,
  FileTooLargeError,
  InvalidFileFieldError,
  InvalidDocumentTypeError,
  FileUploadFailedError,
};
