const express = require('express');
const router = express.Router();

// Get all routes from auth
const signupRoute = require('./signup');
const loginRoute = require('./login');
const sentimentRoute = require('./set_sentiment');

// Use all the routes
router.use('/signup', signupRoute);
router.use('/login', loginRoute);
router.use('/set_sentiment', sentimentRoute);

module.exports = router;