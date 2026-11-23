const { expect } = require('chai');
const request = require('supertest');
const app = require('../../src/app');
const Product = require('../../src/models/product.model');
const { PRODUCT_STATUS } = require('../../src/constants');

describe('API de productos', function () {
	const productData = (overrides = {}) => ({
		name: 'Teclado mecánico',
		description: 'Teclado de prueba',
		price: 50000,
		stock: 10,
		...overrides,
	});

	it('POST /api/products - crea un producto disponible', async function () {
		const res = await request(app)
			.post('/api/products')
			.send(productData());

		expect(res.status).to.equal(201);
		expect(res.body.status).to.equal('success');
		expect(res.body.payload.name).to.equal('Teclado mecánico');
		expect(res.body.payload.price).to.equal(50000);
		expect(res.body.payload.stock).to.equal(10);
		expect(res.body.payload.status).to.equal(PRODUCT_STATUS.AVAILABLE);
	});

	it('POST /api/products - crea un producto sin stock como OUT_OF_STOCK', async function () {
		const res = await request(app)
			.post('/api/products')
			.send(productData({ stock: 0 }));

		expect(res.status).to.equal(201);
		expect(res.body.payload.status).to.equal(PRODUCT_STATUS.OUT_OF_STOCK);
	});

	it('POST /api/products - rechaza campos obligatorios faltantes', async function () {
		const res = await request(app)
			.post('/api/products')
			.send({ description: 'Producto incompleto' });

		expect(res.status).to.equal(400);
		expect(res.body.status).to.equal('error');
		expect(res.body.error.code).to.exist;
	});

	it('POST /api/products - rechaza un precio negativo', async function () {
		const res = await request(app)
			.post('/api/products')
			.send(productData({ price: -100 }));

		expect(res.status).to.equal(400);
		expect(res.body.status).to.equal('error');
	});

	it('POST /api/products - rechaza un stock negativo', async function () {
		const res = await request(app)
			.post('/api/products')
			.send(productData({ stock: -1 }));

		expect(res.status).to.equal(400);
		expect(res.body.status).to.equal('error');
	});

	it('GET /api/products - lista solamente productos disponibles', async function () {
		await Product.create([
			productData({ name: 'Disponible', stock: 5, status: PRODUCT_STATUS.AVAILABLE }),
			productData({ name: 'Agotado', stock: 0, status: PRODUCT_STATUS.OUT_OF_STOCK }),
		]);

		const res = await request(app).get('/api/products');

		expect(res.status).to.equal(200);
		expect(res.body.status).to.equal('success');
		expect(res.body.payload).to.have.lengthOf(1);
		expect(res.body.payload[0].name).to.equal('Disponible');
	});

	it('GET /api/products?includeOutOfStock=true - incluye productos sin stock', async function () {
		await Product.create([
			productData({ name: 'Disponible', stock: 5, status: PRODUCT_STATUS.AVAILABLE }),
			productData({ name: 'Agotado', stock: 0, status: PRODUCT_STATUS.OUT_OF_STOCK }),
		]);

		const res = await request(app)
			.get('/api/products?includeOutOfStock=true');

		expect(res.status).to.equal(200);
		expect(res.body.payload).to.have.lengthOf(2);
	});

	it('GET /api/products/:id - obtiene un producto existente', async function () {
		const product = await Product.create(productData());

		const res = await request(app)
			.get(`/api/products/${product._id}`);

		expect(res.status).to.equal(200);
		expect(res.body.status).to.equal('success');
		expect(res.body.payload._id).to.equal(product._id.toString());
	});

	it('GET /api/products/:id - responde 404 si no existe', async function () {
		const res = await request(app)
			.get('/api/products/507f1f77bcf86cd799439011');

		expect(res.status).to.equal(404);
		expect(res.body.status).to.equal('error');
	});

	it('PUT /api/products/:id - actualiza un producto', async function () {
		const product = await Product.create(productData());

		const res = await request(app)
			.put(`/api/products/${product._id}`)
			.send({ name: 'Teclado actualizado', price: 60000 });

		expect(res.status).to.equal(200);
		expect(res.body.status).to.equal('success');
		expect(res.body.payload.name).to.equal('Teclado actualizado');
		expect(res.body.payload.price).to.equal(60000);
		expect(res.body.payload.stock).to.equal(10);
	});

	it('PUT /api/products/:id - actualiza el estado cuando el stock llega a cero', async function () {
		const product = await Product.create(productData());

		const res = await request(app)
			.put(`/api/products/${product._id}`)
			.send({ stock: 0 });

		expect(res.status).to.equal(200);
		expect(res.body.payload.status).to.equal(PRODUCT_STATUS.OUT_OF_STOCK);
	});

	it('PUT /api/products/:id - rechaza un estado inválido', async function () {
		const product = await Product.create(productData());

		const res = await request(app)
			.put(`/api/products/${product._id}`)
			.send({ status: 'INVALID_STATUS' });

		expect(res.status).to.equal(400);
		expect(res.body.status).to.equal('error');
	});

	it('DELETE /api/products/:id - elimina un producto', async function () {
		const product = await Product.create(productData());

		const res = await request(app)
			.delete(`/api/products/${product._id}`);

		expect(res.status).to.equal(200);
		expect(res.body.status).to.equal('success');

		const deleted = await Product.findById(product._id);
		expect(deleted).to.equal(null);
	});

	it('DELETE /api/products/:id - responde 404 si no existe', async function () {
		const res = await request(app)
			.delete('/api/products/507f1f77bcf86cd799439011');

		expect(res.status).to.equal(404);
		expect(res.body.status).to.equal('error');
	});
});
