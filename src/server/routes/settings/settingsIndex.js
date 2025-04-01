const express = require('express');
const router = express.Router();

// Get all routes from auth
const update_balance_route = require('./update_balance');
const update_credentials_route = require('./update_credentials');
const update_sentiment_route = require('./update_sentiment');
const update_email_route = require('./update_email')

// Use all the routes
router.use('/update_balance', update_balance_route);
router.use('/update_credentials', update_credentials_route);
router.use('/update_sentiment', update_sentiment_route);
router.use('/update_email', update_email_route);

module.exports = router;