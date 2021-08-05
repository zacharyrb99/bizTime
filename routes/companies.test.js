process.env.NODE_ENV = 'test';

const request = require('supertest');
const app = require('../app');
const db = require('../db');

let testCompanies;

beforeEach(async () => {
    const compResults = await db.query(`
        INSERT INTO companies 
        (code, name, description) 
        VALUES 
        ('apple', 'Apple Computer', 'Maker of OSX'), 
        ('ibm', 'IBM', 'Big blue') RETURNING *`);

    testCompanies = compResults.rows;
});

afterEach(async () => await db.query(`DELETE FROM companies`));

afterAll(async () => await db.end());

describe('GET /companies', () => {
    test('Get a list of all companies', async () => {
        const response = await request(app).get('/companies');
        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual({companies: testCompanies});
    });
});

describe('GET /companies/:code', () => {
    test('Gets a company based on company code', async () =>{
        const response = await request(app).get('/companies/apple');
        let expectedResponse = testCompanies[0];
        expectedResponse.invoices = [];

        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual({company: expectedResponse});
    });

    test('Responds with 404 for invalid company code', async () => {
        const response = await request(app).get('/companies/fdsa');
        expect(response.statusCode).toBe(404);
    });
});

describe('POST /companies', () => {
    test('Adds a new company', async () => {
        const response = await request(app).post('/companies').send({code: 'msft', name: 'Microsoft', description: 'Creator of Windows 10'});
        expect(response.statusCode).toBe(201);
        expect(response.body).toEqual({company: {
            code: 'msft',
            name: 'Microsoft',
            description: 'Creator of Windows 10'
        }});
    });
});

describe('PUT /companies/:code', () => {
    test('Updates a single company', async () => {
        const response = await request(app).put('/companies/apple').send({name: 'Apple', description: 'Creator of iPhone'});
        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual({company: {
            code: 'apple',
            name: 'Apple',
            description: 'Creator of iPhone'
        }});
    });

    test('Returns 404 for an invalid company code', async () => {
        const response = await request(app).put('/companies/fdsa').send({name: 'Test', description: 'Test Description'});
        expect(response.statusCode).toBe(404);
    });
});

describe('DELETE /companies/:code', () => {
    test('Deletes a single company', async () => {
        const response = await request(app).delete('/companies/ibm');
        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual({deleted: testCompanies[1]});
    });
});