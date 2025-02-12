// Create simple request to send "Pizza" to the client
const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    res.send("Pizza");
});

module.exports = router;