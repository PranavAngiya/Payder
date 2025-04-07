const express = require('express');
const db = require('../../db_setup');
const router = express.Router();

router.post('/', async (req, res) => { // Kept as router.post and the path
    const { username } = req.body; // Data will be in the request body for POST

    try {
        if (!username) {
            return res.status(400).json({ success: false, message: "Username is required!" });
        }

        // Get the user information
        const userQuery = 'SELECT id FROM users WHERE username = ?';
        const users = await db.query(userQuery, [username]);

        if (users.length === 0) {
            return res.status(400).json({ success: false, message: 'User not found' });
        }

        const user_id = users[0].id;
        console.log(`User ID: ${user_id}`); // Log the user_id

        // Get the user's portfolio
        const portfolioQuery = `
            SELECT ticker, quantity
            FROM portfolio
            WHERE user_id = ?
        `;
        const portfolio = await db.query(portfolioQuery, [user_id]);

        // Log portfolio result
        console.log("Portfolio Data:", portfolio);

        if (portfolio.length === 0) {
            console.log("No portfolio data found for user.");
        }

        return res.status(200).json({ portfolio });

    } catch (error) {
        console.error('Error retrieving portfolio list:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

module.exports = router;



