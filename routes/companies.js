const express = require('express');
const ExpressError = require('../expressError');
const router = express.Router();
const db = require('../db');


router.get('/', async (req, res, next) => {
    try {
        const result = await db.query(`SELECT * FROM companies`);
        return res.json({companies: result.rows});
    } catch(err) {
        return next(err);
    }
});

router.get('/:code', async (req, res, next) => {
    try {
        let code = req.params.code;

        const companyResult = await db.query(`SELECT * FROM companies WHERE code=$1`, [code]);
        const invoiceResult = await db.query(`SELECT id FROM invoices WHERE comp_code=$1`, [code]);

        if(companyResult.rows.length === 0){
            throw new ExpressError(`Can't find company with code: ${code}`, 404);
        }

        const company = companyResult.rows[0];
        const invoices = invoiceResult.rows;
        company.invoices = invoices.map(inv => inv.id);
        
        return res.json({company});
        
    } catch(err) {
        return next(err)
    }
});

router.post('/', async (req, res, next) => {
    try {
        let {code, name, description} = req.body;

        const result = await db.query(`INSERT INTO companies (code, name, description) VALUES ($1, $2, $3) RETURNING *`, [code, name, description]);
        return res.status(201).json({company: result.rows[0]});
    } catch(err) {
        return next(err);
    }
});

router.put('/:code', async (req, res, next) => {
    try {
        let {name, description} = req.body;
        let {code} = req.params;

        const result = await db.query(`UPDATE companies SET name=$1, description=$2 WHERE code=$3 RETURNING *`, [name, description, code]);
        if(result.rows.length === 0){
            throw new ExpressError(`Can't find company with code: ${code}`, 404);
        } else {
            return res.json({company: result.rows[0]});
        }
    } catch(err) {
        return next(err);
    }
});

router.delete('/:code', async (req, res, next) => {
    try {
        let {code} = req.params;
        const result = await db.query(`DELETE FROM companies WHERE code=$1 RETURNING *`, [code]);
        if(result.rows.length === 0){
            throw new ExpressError(`Can't find company with code: ${code}`, 404);
        } else {
            return res.json({deleted: result.rows[0]});
        }
    } catch(err) {
        return next(err);
    }
});

module.exports = router;