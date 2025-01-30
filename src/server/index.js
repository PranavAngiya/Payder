const express = require('express');
const bcrypt = require('bcrypt');
const db = require('./db_setup'); 

const app = express();
const PORT = 8081;

// Middleware
app.use(express.json());

// Signup Route
app.post('/signup', async (req, res) => {
    const { full_name, email, username, password, phone_number, experience_level, investment_goals, account_balance } = req.body;

    if (!full_name || !email || !username || !password) {
        return res.status(400).json({ message: "All required fields must be filled!" });
    }

    try {
        // Hash the password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Insert user into database
        const query = `
            INSERT INTO users (full_name, email, username, password, phone_number, experience_level, investment_goals, account_balance)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;

        db.query(query, [full_name, email, username, hashedPassword, phone_number, experience_level, investment_goals, account_balance || 0.00], (err, results) => {
            if (err) {
                if (err.code === 'ER_DUP_ENTRY') {
                    return res.status(409).json({ message: "Username or email already exists." });
                }
                return res.status(500).json({ message: "Database error", error: err });
            }
            res.status(201).json({ message: "User registered successfully!" });
        });

    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
