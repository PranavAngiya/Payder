const express = require('express');
const router = express.Router();

// Get all routes from api and auth
const authRoutes = require('./auth/authIndex');
// UNCOMMENT THIS WHEN APIs HAVE BEEN ADDED
// UNCOMMENT UNCOMMENT UNCOMMENT UNCOMMENT UNCOMMENT UNCOMMENT
// const apiRoutes = require('./api');
// UNCOMMENT UNCOMMENT UNCOMMENT UNCOMMENT UNCOMMENT UNCOMMENT

// Use all routes from api and auth

// UNCOMMENT THIS WHEN APIs HAVE BEEN ADDED
// UNCOMMENT UNCOMMENT UNCOMMENT UNCOMMENT UNCOMMENT UNCOMMENT
// router.use('/api', apiRoutes);
// UNCOMMENT UNCOMMENT UNCOMMENT UNCOMMENT UNCOMMENT UNCOMMENT

router.use('/auth', authRoutes);

module.exports = router;