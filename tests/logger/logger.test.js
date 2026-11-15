const { expect } = require('chai');
const request = require('supertest');
const app = require('../../src/app');

describe('API de logger', function () {
  it('GET /api/logger/test - debe emitir logs de prueba', async function () {
    const res = await request(app).get('/api/logger/test');

    expect(res.status).to.equal(200);
    expect(res.body.status).to.equal('success');
    expect(res.body).to.have.property('payload');
  });
});
