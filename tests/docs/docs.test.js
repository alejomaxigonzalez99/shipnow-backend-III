const { expect } = require('chai');
const request = require('supertest');
const app = require('../../src/app');

describe('Documentación Swagger', function () {
  it('GET /api/docs/openapi.json - debe devolver la especificación OpenAPI', async function () {
    const res = await request(app).get('/api/docs/openapi.json');

    expect(res.status).to.equal(200);
    expect(res.body.openapi).to.equal('3.0.3');
    expect(res.body.info.title).to.equal('ShipNow API');
    expect(res.body.paths).to.be.an('object');
    expect(Object.keys(res.body.paths).length).to.be.greaterThan(0);
  });

  it('GET /api/docs/ - debe mostrar la documentación Swagger', async function () {
    const res = await request(app).get('/api/docs/');

    expect(res.status).to.equal(200);
    expect(res.text).to.include('swagger');
  });
});
