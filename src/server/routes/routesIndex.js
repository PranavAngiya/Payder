const express = require('express');
const router = express.Router();

// Get all routes from api and auth
const authRoutes = require('./auth/authIndex');
const apiRoutes = require('./api/apiIndex');

// Use all routes from api and auth
router.use('/api', apiRoutes);
router.use('/auth', authRoutes);

module.exports = router;