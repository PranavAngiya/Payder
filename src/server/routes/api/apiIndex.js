const express = require('express');
const router = express.Router();

// Get all routes from auth
// For example:  "const signupRoute = require('./signup');"
const traderRoute = require('./trader');
const balance = require('./balance')

// Use all the routes
// For example: "router.use('/signup', signupRoute);"
router.use('/trader', traderRoute);
router.use('/balance', balance)

module.exports = router;