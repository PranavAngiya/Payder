const express = require('express');
const db = require('../../db_setup');

const router = express.Router();

router.post('/', async (req, res) => {
    
    const { username } = req.body;

    if (!username) {
        return res.status(400).json({ message: "All required fields must be filled!" });
    }

    try{
        const balanceQuery = 'SELECT * FROM users WHERE username = ?';
        const user = await db.query(balanceQuery, [username]);

        if (user.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json({ balance: user[0].account_balance });

    } catch (error) {
        console.error('Error retrieving balance:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
    
});

module.exports = router;

