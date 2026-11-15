const { expect } = require('chai');
const request = require('supertest');
const app = require('../../src/app');
const User = require('../../src/models/user.model');

describe('API de pedidos', function () {
  let user;

  beforeEach(async function () {
    user = await User.create({
      name: 'Cliente de prueba',
      email: 'cliente@test.com',
      password: 'password123',
    });
  });

  const orderData = () => ({
    user: user._id.toString(),
    items: [
      { name: 'Mouse Logitech', quantity: 2, unitPrice: 25000 },
      { name: 'Teclado', quantity: 1, unitPrice: 30000 },
    ],
    shippingAddress: 'Calle de prueba 123',
    priority: 'NORMAL',
  });

  it('POST /api/orders - debe crear un pedido y calcular el total', async function () {
    const res = await request(app)
      .post('/api/orders')
      .send(orderData());

    expect(res.status).to.equal(201);
    expect(res.body.status).to.equal('success');
    expect(res.body.payload.total).to.equal(80000);
    expect(res.body.payload.status).to.equal('PENDING');
  });

  it('GET /api/orders - debe listar los pedidos', async function () {
    await request(app).post('/api/orders').send(orderData());

    const res = await request(app).get('/api/orders');

    expect(res.status).to.equal(200);
    expect(res.body.status).to.equal('success');
    expect(res.body.payload).to.be.an('array').with.lengthOf(1);
  });

  it('GET /api/orders/:id - debe obtener un pedido', async function () {
    const created = await request(app)
      .post('/api/orders')
      .send(orderData());

    const id = created.body.payload._id;
    const res = await request(app).get(`/api/orders/${id}`);

    expect(res.status).to.equal(200);
    expect(res.body.status).to.equal('success');
    expect(res.body.payload._id).to.equal(id);
  });

  it('PATCH /api/orders/:id/status - debe actualizar el estado', async function () {
    const created = await request(app)
      .post('/api/orders')
      .send(orderData());

    const id = created.body.payload._id;
    const res = await request(app)
      .patch(`/api/orders/${id}/status`)
      .send({ status: 'CONFIRMED' });

    expect(res.status).to.equal(200);
    expect(res.body.status).to.equal('success');
    expect(res.body.payload.status).to.equal('CONFIRMED');
  });

  it('GET /api/orders/:id - debe responder 404 si no existe', async function () {
    const res = await request(app)
      .get('/api/orders/507f1f77bcf86cd799439011');

    expect(res.status).to.equal(404);
    expect(res.body.status).to.equal('error');
    expect(res.body.error).to.have.property('code');
    expect(res.body.error).to.have.property('message');
  });
});
