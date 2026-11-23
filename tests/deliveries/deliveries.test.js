const { expect } = require('chai');
const request = require('supertest');
const app = require('../../src/app');
const User = require('../../src/models/user.model');
const Delivery = require('../../src/models/delivery.model');
const {
	USER_ROLES,
	DELIVERY_STATUS,
} = require('../../src/constants');

describe('API de entregas', function () {
	let courier;
	let customer;
	let delivery;

	const VALID_ID = '507f1f77bcf86cd799439011';

	const createDelivery = (overrides = {}) =>
		Delivery.create({
			order: VALID_ID,
			status: DELIVERY_STATUS.PENDING,
			...overrides,
		});

	beforeEach(async function () {
		courier = await User.create({
			name: 'Repartidor de prueba',
			email: 'courier@test.com',
			password: 'password123',
			role: USER_ROLES.COURIER,
		});

		customer = await User.create({
			name: 'Cliente de prueba',
			email: 'customer-delivery@test.com',
			password: 'password123',
			role: USER_ROLES.CUSTOMER,
		});

		delivery = await createDelivery();
	});

	it('GET /api/deliveries - lista las entregas', async function () {
		const res = await request(app).get('/api/deliveries');

		expect(res.status).to.equal(200);
		expect(res.body.status).to.equal('success');
		expect(res.body.payload).to.be.an('array').with.lengthOf(1);
	});

	it('GET /api/deliveries?status=PENDING - filtra por estado', async function () {
		await createDelivery({ status: DELIVERY_STATUS.FAILED });

		const res = await request(app)
			.get('/api/deliveries?status=PENDING');

		expect(res.status).to.equal(200);
		expect(res.body.payload).to.have.lengthOf(1);
		expect(res.body.payload[0].status).to.equal(DELIVERY_STATUS.PENDING);
	});

	it('GET /api/deliveries - rechaza un filtro de estado inválido', async function () {
		const res = await request(app)
			.get('/api/deliveries?status=INVALID');

		expect(res.status).to.equal(400);
		expect(res.body.status).to.equal('error');
		expect(res.body.error.code).to.equal('INVALID_STATUS');
	});

	it('GET /api/deliveries?page=1&limit=1 - pagina los resultados', async function () {
		await createDelivery();

		const res = await request(app)
			.get('/api/deliveries?page=1&limit=1');

		expect(res.status).to.equal(200);
		expect(res.body.payload).to.have.lengthOf(1);
	});

	it('GET /api/deliveries/:id - obtiene una entrega existente', async function () {
		const res = await request(app)
			.get(`/api/deliveries/${delivery._id}`);

		expect(res.status).to.equal(200);
		expect(res.body.status).to.equal('success');
		expect(res.body.payload._id).to.equal(delivery._id.toString());
	});

	it('GET /api/deliveries/:id - responde 404 si no existe', async function () {
		const res = await request(app)
			.get(`/api/deliveries/${VALID_ID}`);

		expect(res.status).to.equal(404);
		expect(res.body.status).to.equal('error');
		expect(res.body.error.code).to.equal('DELIVERY_NOT_FOUND');
	});

	it('PATCH /api/deliveries/:id/courier - asigna un repartidor válido', async function () {
		const res = await request(app)
			.patch(`/api/deliveries/${delivery._id}/courier`)
			.send({ courier: courier._id.toString() });

		expect(res.status).to.equal(200);
		expect(res.body.status).to.equal('success');
		expect(res.body.payload.courier.toString()).to.equal(courier._id.toString());
		expect(res.body.payload.status).to.equal(DELIVERY_STATUS.ASSIGNED);
	});

	it('PATCH /api/deliveries/:id/courier - rechaza la ausencia de repartidor', async function () {
		const res = await request(app)
			.patch(`/api/deliveries/${delivery._id}/courier`)
			.send({});

		expect(res.status).to.equal(400);
		expect(res.body.status).to.equal('error');
		expect(res.body.error.code).to.equal('MISSING_FIELDS');
	});

	it('PATCH /api/deliveries/:id/courier - rechaza un usuario que no sea repartidor', async function () {
		const res = await request(app)
			.patch(`/api/deliveries/${delivery._id}/courier`)
			.send({ courier: customer._id.toString() });

		expect(res.status).to.equal(400);
		expect(res.body.status).to.equal('error');
		expect(res.body.error.code).to.equal('INVALID_COURIER');
	});

	it('PATCH /api/deliveries/:id/courier - rechaza un repartidor inexistente', async function () {
		const res = await request(app)
			.patch(`/api/deliveries/${delivery._id}/courier`)
			.send({ courier: VALID_ID });

		expect(res.status).to.equal(404);
		expect(res.body.status).to.equal('error');
		expect(res.body.error.code).to.equal('USER_NOT_FOUND');
	});

	it('PATCH /api/deliveries/:id/courier - rechaza una entrega que ya está en tránsito', async function () {
		const inTransit = await createDelivery({
			status: DELIVERY_STATUS.IN_TRANSIT,
			courier: courier._id,
		});

		const res = await request(app)
			.patch(`/api/deliveries/${inTransit._id}/courier`)
			.send({ courier: courier._id.toString() });

		expect(res.status).to.equal(409);
		expect(res.body.error.code).to.equal('INVALID_STATUS_TRANSITION');
	});

	it('PATCH /api/deliveries/:id/status - cambia de PENDING a FAILED', async function () {
		const res = await request(app)
			.patch(`/api/deliveries/${delivery._id}/status`)
			.send({ status: DELIVERY_STATUS.FAILED });

		expect(res.status).to.equal(200);
		expect(res.body.status).to.equal('success');
		expect(res.body.payload.status).to.equal(DELIVERY_STATUS.FAILED);
	});

	it('PATCH /api/deliveries/:id/status - rechaza una transición inválida', async function () {
		const res = await request(app)
			.patch(`/api/deliveries/${delivery._id}/status`)
			.send({ status: DELIVERY_STATUS.DELIVERED });

		expect(res.status).to.equal(409);
		expect(res.body.error.code).to.equal('INVALID_STATUS_TRANSITION');
	});

	it('PATCH /api/deliveries/:id/status - exige repartidor para pasar a ASSIGNED', async function () {
		const res = await request(app)
			.patch(`/api/deliveries/${delivery._id}/status`)
			.send({ status: DELIVERY_STATUS.ASSIGNED });

		expect(res.status).to.equal(409);
		expect(res.body.error.code).to.equal('DELIVERY_COURIER_REQUIRED');
	});

	it('PATCH /api/deliveries/:id/status - registra deliveredAt al completar la entrega', async function () {
		const assigned = await Delivery.create({
			order: VALID_ID,
			status: DELIVERY_STATUS.ASSIGNED,
			courier: courier._id,
		});

		const inTransit = await request(app)
			.patch(`/api/deliveries/${assigned._id}/status`)
			.send({ status: DELIVERY_STATUS.IN_TRANSIT });

		expect(inTransit.status).to.equal(200);

		const delivered = await request(app)
			.patch(`/api/deliveries/${assigned._id}/status`)
			.send({ status: DELIVERY_STATUS.DELIVERED });

		expect(delivered.status).to.equal(200);
		expect(delivered.body.payload.status).to.equal(DELIVERY_STATUS.DELIVERED);
		expect(delivered.body.payload.deliveredAt).to.exist;
	});
});
