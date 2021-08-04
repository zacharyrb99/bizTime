const express = require('express');
const ExpressError = require('./expressError');
const companyRoutes = require('./routes/companies');
const invoiceRoutes = require('./routes/invoices');
const app = express();

app.use(express.json());
app.use('/companies', companyRoutes);
app.use('/invoices', invoiceRoutes);

//404 Handler
app.use((req, res, next) => {
    let e = new ExpressError('Page not found', 404);
    next(e);
});

//Generic Error Handler
app.use((error, req, res, next) => {
    let status = error.status || 500;

    return res.status(status).json({
        error: {
            message: error.message,
            status_code: status
        }
    })
})

module.exports = app;