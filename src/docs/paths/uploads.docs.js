const { paramRef, errorResponses, successResponse, ref, INTERNAL, DB_DOWN, INVALID_ID } = require('../helpers');
const { OBJECT_ID_EXAMPLE } = require('../components/schemas');
const { USER_DOCUMENT_TYPES, UPLOAD_CONFIG } = require('../../constants');

const userExample = {
  _id: OBJECT_ID_EXAMPLE,
  name: 'Ana Pérez',
  email: 'ana.perez@test.com',
  role: 'CUSTOMER',
  documents: [{
    originalName: 'dni.pdf',
    filename: '1731600000000-uuid.pdf',
    path: 'uploads/user-documents/1731600000000-uuid.pdf',
    mimeType: 'application/pdf',
    size: 120000,
    documentType: 'IDENTITY',
    uploadedAt: '2026-11-15T19:00:00.000Z',
  }],
};

const deliveryExample = {
  _id: OBJECT_ID_EXAMPLE,
  order: '64b1f6f5a1b2c3d4e5f60abc',
  courier: null,
  status: 'PENDING',
  receipt: {
    originalName: 'comprobante.pdf',
    filename: '1731600000000-uuid.pdf',
    path: 'uploads/delivery-receipts/1731600000000-uuid.pdf',
    mimeType: 'application/pdf',
    size: 120000,
    documentType: 'DELIVERY_RECEIPT',
    uploadedAt: '2026-11-15T19:00:00.000Z',
  },
};

const uploadRequestBody = (withDocumentType = false) => ({
  required: true,
  content: {
    'multipart/form-data': {
      schema: {
        type: 'object',
        required: ['file'],
        properties: {
          file: { type: 'string', format: 'binary', description: 'PDF, JPG, JPEG, PNG o WEBP. Máximo 5 MB.' },
          ...(withDocumentType ? {
            documentType: {
              type: 'string',
              enum: Object.values(USER_DOCUMENT_TYPES),
              default: USER_DOCUMENT_TYPES.OTHER,
              description: 'Opcional. Si se omite se guarda como OTHER.',
            },
          } : {}),
        },
      },
    },
  },
});

const fileErrors = [
  { code: 'FILE_REQUIRED' },
  { code: 'FILE_TYPE_INVALID', details: { mimeType: 'application/x-msdownload', extension: '.exe' } },
  { code: 'FILE_TOO_LARGE', details: { maxBytes: UPLOAD_CONFIG.MAX_FILE_SIZE } },
  { code: 'FILE_FIELD_INVALID', details: { received: 'document', expected: 'file' } },
  { code: 'FILE_UPLOAD_FAILED' },
];

const uploadsPaths = {
  '/api/users/{id}/documents': {
    post: {
      tags: ['Uploads', 'Users'],
      summary: 'Cargar un documento de usuario',
      description: `Adjunta un documento a un usuario existente. Campo de archivo: \`file\`. Tipos permitidos: ${Object.values(USER_DOCUMENT_TYPES).join(', ')}. Formatos aceptados: PDF, JPG, JPEG, PNG y WEBP; tamaño máximo 5 MB.`,
      operationId: 'uploadUserDocument',
      parameters: [paramRef('Id')],
      requestBody: uploadRequestBody(true),
      responses: {
        201: successResponse('Documento guardado y asociado al usuario', ref('User'), userExample),
        ...errorResponses(`/api/users/${OBJECT_ID_EXAMPLE}/documents`, [
          INVALID_ID(),
          { code: 'USER_NOT_FOUND', details: { id: OBJECT_ID_EXAMPLE } },
          { code: 'DOCUMENT_TYPE_INVALID', details: { received: 'PASSPORT', allowed: Object.values(USER_DOCUMENT_TYPES) } },
          ...fileErrors,
          DB_DOWN,
          INTERNAL,
        ]),
      },
    },
  },
  '/api/deliveries/{id}/receipt': {
    post: {
      tags: ['Uploads', 'Deliveries'],
      summary: 'Cargar comprobante de entrega',
      description: 'Adjunta un comprobante a una entrega existente. Campo de archivo: `file`. Formatos aceptados: PDF, JPG, JPEG, PNG y WEBP; tamaño máximo 5 MB.',
      operationId: 'uploadDeliveryReceipt',
      parameters: [paramRef('Id')],
      requestBody: uploadRequestBody(false),
      responses: {
        201: successResponse('Comprobante guardado y asociado a la entrega', ref('Delivery'), deliveryExample),
        ...errorResponses(`/api/deliveries/${OBJECT_ID_EXAMPLE}/receipt`, [
          INVALID_ID(),
          { code: 'DELIVERY_NOT_FOUND', details: { id: OBJECT_ID_EXAMPLE } },
          ...fileErrors,
          DB_DOWN,
          INTERNAL,
        ]),
      },
    },
  },
};

module.exports = { uploadsPaths };
