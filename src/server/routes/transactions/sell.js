const express = require('express');
const db = require('../../db_setup');
require('dotenv').config();

const router = express.Router();

router.post('/', async (req, res) => {
    const { username, ticker, quantity, curr_price } = req.body;

    try {
        // Check for missing fields
        if (!username || !ticker || !quantity || !curr_price) {
            return res.status(400).json({ message: "Missing field(s)." });
        }

        // Retrieve user
        const queryUser = 'SELECT * FROM users WHERE username = ?';
        const users = await db.query(queryUser, [username]);

        if (users.length === 0) {
            return res.status(400).json({ message: "There is no user with the provided username." });
        }

        const user = users[0];
        const userID = user.id;
        const balance = parseFloat(user.account_balance);

        // Check quantity and price
        if (quantity <= 0) {
            return res.status(400).json({ message: "Invalid quantity given." });
        }

        if (curr_price <= 0) {
            return res.status(400).json({ message: "Invalid current share price." });
        }

        // Check user's portfolio
        const queryPortfolio = 'SELECT f_id, ticker, quantity FROM portfolio WHERE user_id = ?';
        const stocks = await db.query(queryPortfolio, [userID]);

        if (stocks.length === 0) {
            return res.status(400).json({ message: "You have no stocks to sell." });
        }

        const stock = stocks.find(s => s.ticker === ticker);

        if (!stock) {
            return res.status(400).json({ message: "You don't have this stock in your portfolio." });
        }

        let shares_owned = stock.quantity;
        let portfolio_id = stock.f_id;

        if (shares_owned < quantity) {
            return res.status(400).json({ message: "The quantity of shares that you've selected exceeds the current number of shares in your possession." });
        }

        const updated_balance = balance + quantity * curr_price;

        if (shares_owned === quantity) {
            // Delete the stock
            await db.query('DELETE FROM portfolio WHERE f_id = ?', [portfolio_id]);
        } else {
            // Update quantity
            await db.query('UPDATE portfolio SET quantity = ? WHERE f_id = ?', [shares_owned - quantity, portfolio_id]);
        }

        // Update balance
        await db.query('UPDATE users SET account_balance = ? WHERE id = ?', [updated_balance, userID]);

        return res.status(200).json({ message: "Transaction completed successfully." });

    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
});

module.exports = router;
