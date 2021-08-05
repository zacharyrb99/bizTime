process.env.NODE_ENV = 'test';

const request = require('supertest');
const app = require('../app');
const db = require('../db');

let testInvoice;
let testCompany;

beforeEach(async () => {
    const compResults = await db.query(`
        INSERT INTO companies
        (code, name, description)
        VALUES ('apple', 'Apple', 'Creator of iPhone')
        RETURNING *`);

    const invoiceResults = await db.query(`
        INSERT INTO invoices
        (id, comp_code, amt, paid, paid_date)
        VALUES (1, 'apple', 500, false, null)
        RETURNING comp_code, amt, paid`);

    testInvoice = invoiceResults.rows[0];
    testCompany = compResults.rows[0];
});

afterEach(async () => {
    await db.query(`DELETE FROM invoices`);
    await db.query(`DELETE FROM companies`);
});

afterAll(async () => await db.end());

describe('GET /invoices', () => {
    test('Get a list of all invoices', async () => {
        const response = await request(app).get('/invoices');
        expect(response.statusCode).toBe(200);
        expect(response.body.invoices[0]).toEqual(testInvoice);  
    });
});

describe('GET /invoices/:id', () => {
    test('Get a single invoice', async () => {
        const response = await request(app).get('/invoices/1');

        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual({invoice: {
            id: 1, 
            amt: 500,
            paid: false,
            paid_date: null,
            company: testCompany
        }})
    });
});

describe('POST /invoices', () => {
    test('Add a new invoice', async () => {
        const response = await request(app).post('/invoices').send({comp_code: 'apple', amt: 670});
        expect(response.statusCode).toBe(201);
        expect(response.body).toEqual({invoice: {
            comp_code: 'apple',
            amt: 670,
            paid: false
        }});
    });

    test('Returns 500 with invalid comp_code', async () => {
        const response = await request(app).post('/invoices').send({comp_code: 'msft', amt: 100});
        expect(response.statusCode).toBe(500);
    });
});

describe('PUT /invoices/:id', () => {
    test('Edit an invoice', async () => {
        const response = await request(app).put('/invoices/1').send({amt: 1000});
        expect(response.statusCode).toBe(200);
        testInvoice.amt = 1000;
        expect(response.body).toEqual({invoice: testInvoice});
    });

    test('Returns 404 with invalid id', async () => {
        const response = await request(app).put('/invoices/4324').send({amt:1});
        expect(response.statusCode).toBe(404);
    });
});

describe('DELETE /invoices/:id', () => {
    test('Delete a single invoice', async () => {
        const response = await request(app).delete('/invoices/1');
        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual({deleted: testInvoice});
    });

    test('Returns 404 with invalid id', async () => {
        const response = await request(app).delete('/invoices/2342');
        expect(response.statusCode).toBe(404);
    })
});