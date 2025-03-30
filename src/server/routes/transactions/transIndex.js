const express = require('express');
const router = express.Router();

// Get all routes from auth
const buy_manual_route = require('./buy_manual');
const buy_balance_route = require('./buy_balance');
const sellRoute = require('./sell');
const balanceRoute = require('./add_to_balance');

// Use all the routes
router.use('/buy_manual', buy_manual_route);
router.use('/buy_balance', buy_balance_route);
router.use('/sell', sellRoute);
router.use('/add_balance', balanceRoute);

module.exports = router;