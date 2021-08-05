const express = require('express');
const ExpressError = require('../expressError');
const router = express.Router();
const db = require('../db');

router.get('/', async (req, res, next) => {
    try {
        const result = await db.query(`SELECT comp_code, amt, paid FROM invoices`);
        return res.json({invoices: result.rows});
    } catch(err) {
        return next(err);
    }
});

router.get('/:id', async (req, res, next) => {
    try {
        let {id} = req.params;
        const result = await db.query(
            `SELECT invoices.id,
            invoices.comp_code,
            invoices.amt,
            invoices.paid, 
            invoices.paid_date, 
            companies.name, 
            companies.description 
            FROM invoices INNER JOIN companies ON (invoices.comp_code = companies.code) WHERE id=$1`, [id]);
        
        if(result.rows.length === 0){
            throw new ExpressError(`Can't find invoice with id: ${id}`);
        }

        const invoice = {
            id: result.rows[0].id,
            amt: result.rows[0].amt,
            paid: result.rows[0].paid,
            paid_date: result.rows[0].paid_date,
            company: {
                code: result.rows[0].comp_code,
                name: result.rows[0].name,
                description: result.rows[0].description
            }
        };

        return res.json({invoice: invoice});
    } catch(err) {
        return next(err);
    }
});

router.post('/', async (req, res, next) => {
    try {
        let {comp_code, amt} = req.body;
        const result = await db.query(`INSERT INTO invoices (comp_code, amt) VALUES ($1, $2) RETURNING comp_code, amt, paid`, [comp_code, amt]);
        return res.status(201).json({invoice: result.rows[0]});
    } catch(err) {
        return next(err);
    }
});

router.put('/:id', async (req, res, next) => {
    try {
        let {amt} = req.body; 
        let {id} = req.params;
        const result = await db.query(`UPDATE invoices SET amt=$1 WHERE id=$2 RETURNING comp_code, amt, paid`, [amt, id]);

        if(result.rows.length === 0){
            throw new ExpressError(`Can't find invoice with id: ${id}`, 404);
        }

        return res.json({invoice: result.rows[0]});
    } catch(err) {
        return next(err);
    }
});

router.delete('/:id', async (req, res, next) => {
    try {
        let {id} = req.params;
        const result = await db.query(`DELETE FROM invoices WHERE id=$1 RETURNING comp_code, amt, paid`, [id]);

        if(result.rows.length === 0){
            throw new ExpressError(`Can't find invoice with id: ${id}`, 404);
        }

        return res.json({deleted: result.rows[0]});
    } catch(err) {
        return next(err);
    }
});

module.exports = router;