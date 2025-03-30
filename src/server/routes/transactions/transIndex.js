const express = require('express');
const router = express.Router();

// Get all routes from auth
const buyRoute = require('./buy_manual.js');
const sellRoute = require('./sell');
const balanceRoute = require('./add_to_balance.js');

// Use all the routes
router.use('/buy', buyRoute);
router.use('/sell', sellRoute);
router.use('/add_balance', balanceRoute);

module.exports = router;