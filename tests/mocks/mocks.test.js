const { expect } = require('chai');
const request = require('supertest');
const app = require('../../src/app');
const User = require('../../src/models/user.model');
const Order = require('../../src/models/order.model');

describe('API de mocks', function () {
  it('GET /api/mocks/users - debe generar usuarios simulados', async function () {
    const res = await request(app).get('/api/mocks/users?qty=3');

    expect(res.status).to.equal(200);
    expect(res.body).to.be.an('array').with.lengthOf(3);
    expect(res.body[0]).to.have.property('email');
  });

  it('GET /api/mocks/dataset - debe generar un conjunto de datos', async function () {
    const res = await request(app).get('/api/mocks/dataset?qty=2');

    expect(res.status).to.equal(200);
    expect(res.body).to.be.an('object');
    expect(res.body).to.have.property('users');
    expect(res.body).to.have.property('orders');
    expect(res.body.users).to.be.an('array');
    expect(res.body.orders).to.be.an('array');
  });

  it('GET /api/mocks/users - debe rechazar una cantidad inválida', async function () {
    const res = await request(app).get('/api/mocks/users?qty=abc');

    expect(res.status).to.be.within(400, 499);
    expect(res.body.status).to.equal('error');
    expect(res.body.error).to.have.property('code');
    expect(res.body.error).to.have.property('message');
  });

  it('POST /api/mocks/seed - debe insertar datos de prueba', async function () {
    const res = await request(app)
      .post('/api/mocks/seed')
      .send({ qty: 2 });

    expect(res.status).to.equal(201);
    expect(res.body).to.have.property('insertados');
    expect(res.body.insertados).to.be.a('number');

    const users = await User.countDocuments();
    const orders = await Order.countDocuments();

    expect(users).to.be.greaterThan(0);
    expect(orders).to.be.greaterThan(0);
  });
});
