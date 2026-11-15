const { expect } = require('chai');
const request = require('supertest');
const fs = require('fs/promises');
const path = require('path');
const app = require('../../src/app');
const User = require('../../src/models/user.model');
const Delivery = require('../../src/models/delivery.model');
const { UPLOAD_ROOT } = require('../../src/config/upload.config');

const PDF_BUFFER = Buffer.from('%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\n%%EOF');
const VALID_ID = '507f1f77bcf86cd799439011';

const attachPdf = (test, field = 'file', filename = 'documento.pdf') =>
  test.attach(field, PDF_BUFFER, { filename, contentType: 'application/pdf' });

describe('Carga de archivos (Módulo 7)', function () {
  let user;
  let delivery;

  beforeEach(async function () {
    user = await User.create({
      name: 'Usuario Upload',
      email: 'upload@test.com',
      password: 'password123',
    });
    delivery = await Delivery.create({
      order: VALID_ID,
      status: 'PENDING',
    });
  });

  it('POST /api/users/:id/documents - guarda archivo y asocia metadatos al usuario', async function () {
    const res = await attachPdf(
      request(app).post(`/api/users/${user._id}/documents`).field('documentType', 'IDENTITY')
    );

    expect(res.status).to.equal(201);
    expect(res.body.status).to.equal('success');
    expect(res.body.payload.documents).to.have.lengthOf(1);
    expect(res.body.payload.documents[0]).to.include({
      originalName: 'documento.pdf',
      mimeType: 'application/pdf',
      documentType: 'IDENTITY',
    });
    expect(res.body.payload.documents[0].filename).not.to.equal('documento.pdf');
    const storedPath = path.resolve(__dirname, '../..', res.body.payload.documents[0].path);
    const stat = await fs.stat(storedPath);
    expect(stat.isFile()).to.equal(true);
  });

  it('POST /api/users/:id/documents - responde FILE_REQUIRED si no se adjunta archivo', async function () {
    const res = await request(app)
      .post(`/api/users/${user._id}/documents`)
      .field('documentType', 'IDENTITY');

    expect(res.status).to.equal(400);
    expect(res.body.error.code).to.equal('FILE_REQUIRED');
  });

  it('POST /api/users/:id/documents - rechaza un tipo de documento inválido', async function () {
    const res = await attachPdf(
      request(app).post(`/api/users/${user._id}/documents`).field('documentType', 'PASSPORT')
    );

    expect(res.status).to.equal(400);
    expect(res.body.error.code).to.equal('DOCUMENT_TYPE_INVALID');
    const refreshed = await User.findById(user._id).lean();
    expect(refreshed.documents).to.have.lengthOf(0);
  });

  it('POST /api/users/:id/documents - responde USER_NOT_FOUND y limpia el archivo', async function () {
    const res = await attachPdf(request(app).post(`/api/users/${VALID_ID}/documents`));

    expect(res.status).to.equal(404);
    expect(res.body.error.code).to.equal('USER_NOT_FOUND');
    const files = await fs.readdir(path.join(UPLOAD_ROOT, 'user-documents')).catch(() => []);
    expect(files).to.have.lengthOf(0);
  });

  it('POST /api/deliveries/:id/receipt - guarda comprobante y lo asocia a la entrega', async function () {
    const res = await attachPdf(request(app).post(`/api/deliveries/${delivery._id}/receipt`), 'file', 'recibo.pdf');

    expect(res.status).to.equal(201);
    expect(res.body.status).to.equal('success');
    expect(res.body.payload.receipt).to.include({
      originalName: 'recibo.pdf',
      mimeType: 'application/pdf',
      documentType: 'DELIVERY_RECEIPT',
    });
    expect(res.body.payload.receipt.path).to.match(/^uploads\/delivery-receipts\//);
  });

  it('POST /api/deliveries/:id/receipt - responde FILE_REQUIRED si no se adjunta archivo', async function () {
    const res = await request(app).post(`/api/deliveries/${delivery._id}/receipt`);

    expect(res.status).to.equal(400);
    expect(res.body.error.code).to.equal('FILE_REQUIRED');
  });

  it('POST /api/deliveries/:id/receipt - responde DELIVERY_NOT_FOUND y limpia el archivo', async function () {
    const res = await attachPdf(request(app).post(`/api/deliveries/${VALID_ID}/receipt`));

    expect(res.status).to.equal(404);
    expect(res.body.error.code).to.equal('DELIVERY_NOT_FOUND');
    const files = await fs.readdir(path.join(UPLOAD_ROOT, 'delivery-receipts')).catch(() => []);
    expect(files).to.have.lengthOf(0);
  });

  it('rechaza un campo de archivo distinto de file', async function () {
    const res = await attachPdf(request(app).post(`/api/users/${user._id}/documents`), 'document');

    expect(res.status).to.equal(400);
    expect(res.body.error.code).to.equal('FILE_FIELD_INVALID');
  });

  it('rechaza una extensión que no corresponde al MIME permitido', async function () {
    const res = await request(app)
      .post(`/api/users/${user._id}/documents`)
      .attach('file', Buffer.from('contenido'), {
        filename: 'archivo.exe',
        contentType: 'application/x-msdownload',
      });

    expect(res.status).to.equal(400);
    expect(res.body.error.code).to.equal('FILE_TYPE_INVALID');
  });
});
