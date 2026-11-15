const { expect } = require('chai');
const request = require('supertest');
const app = require('../../src/app');
const User = require('../../src/models/user.model');

describe('API de usuarios', function () {
  it('GET /api/users - debe listar usuarios', async function () {
    await User.create({
      name: 'Usuario de prueba',
      email: 'usuario@test.com',
      password: 'password123',
    });

    const res = await request(app).get('/api/users');

    expect(res.status).to.equal(200);
    expect(res.body.status).to.equal('success');
    expect(res.body.payload).to.be.an('array');
    expect(res.body.payload).to.have.lengthOf(1);
    expect(res.body.payload[0]).not.to.have.property('password');
  });

  it('POST /api/users - debe crear un usuario', async function () {
    const res = await request(app)
      .post('/api/users')
      .send({
        name: 'Nuevo usuario',
        email: 'nuevo@test.com',
        password: 'password123',
      });

    expect(res.status).to.equal(201);
    expect(res.body.status).to.equal('success');
    expect(res.body.payload.email).to.equal('nuevo@test.com');
    expect(res.body.payload).not.to.have.property('password');
  });

  it('GET /api/users/:id - debe obtener un usuario', async function () {
    const user = await User.create({
      name: 'Usuario individual',
      email: 'individual@test.com',
      password: 'password123',
    });

    const res = await request(app).get(`/api/users/${user._id}`);

    expect(res.status).to.equal(200);
    expect(res.body.status).to.equal('success');
    expect(res.body.payload.email).to.equal('individual@test.com');
  });

  it('GET /api/users/:id - debe responder 404 si no existe', async function () {
    const res = await request(app)
      .get('/api/users/507f1f77bcf86cd799439011');

    expect(res.status).to.equal(404);
    expect(res.body.status).to.equal('error');
    expect(res.body.error).to.have.property('code');
    expect(res.body.error).to.have.property('message');
  });
});
