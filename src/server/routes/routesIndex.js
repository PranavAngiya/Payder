const express = require('express');
const router = express.Router();

// Get all routes
const authRoutes = require('./auth/authIndex');
const apiRoutes = require('./api/apiIndex');
const transactionRoutes = require('./transactions/transIndex');
const settingsRoutes = require('./settings/settingsIndex');


// Use all routes
router.use('/api', apiRoutes);
router.use('/auth', authRoutes);
router.use('/transaction', transactionRoutes);
router.use('/setting', settingsRoutes);

module.exports = router;