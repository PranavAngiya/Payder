const express = require('express');
const router = express.Router();

// Get all routes from auth
const update_balance_route = require('./update_balance');
const update_username_route = require('./update_username');
const update_sentiment_route = require('./update_sentiment');
const update_email_route = require('./update_email');
const update_password_route = require('./update_password');

// Use all the routes
router.use('/update_balance', update_balance_route);
router.use('/update_username', update_username_route);
router.use('/update_sentiment', update_sentiment_route);
router.use('/update_email', update_email_route);
router.use('/update_password', update_password_route);

module.exports = router;