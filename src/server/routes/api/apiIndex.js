const express = require('express');
const router = express.Router();

// Get all routes from auth
// For example:  "const signupRoute = require('./signup');"
const traderRoute = require('./trader');
const balance = require('./balance');
const list_portfolio = require('./list_portfolio');
const uservalue = require('./uservalue');

// Use all the routes
// For example: "router.use('/signup', signupRoute);"
router.use('/trader', traderRoute);
router.use('/balance', balance)
router.use('/list_portfolio', list_portfolio);
router.use('/uservalue', uservalue);

module.exports = router;