const express = require('express');
const db = require('../../db_setup');

const router = express.Router();

router.post('/balance', async (req, res) => {
    try {
        const { username } = req.body;

        if (!username) {
            return res.status(400).json({ message: "All required fields must be filled!" });
        }

        const balanceQuery = 'SELECT account_balance FROM users WHERE username = ?';
        const [rows] = await db.query(balanceQuery, [username]);

        if (rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json({ balance: rows[0].account_balance });

    } catch (error) {
        console.error('Error retrieving balance:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

module.exports = router;

