const express = require('express');
const bcrypt = require('bcrypt');
const db = require('../../db_setup');
const jwt = require('jsonwebtoken');
require ('dotenv').config();

const SECRET_KEY = process.env.JWT_SECRET_KEY;

const router = express.Router();

router.post('/', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: "All required fields must be filled!" });
    }
    
    try {
        const userQuery = 'SELECT * FROM users WHERE username = ?';
        const user = await db.query(userQuery, [username]);

        if (user.length === 0) {
            return res.status(400).json({ message: "User not found" });
        }

        const passwordMatch = await bcrypt.compare(password, user[0].password);

        if (!passwordMatch) {
            return res.status(400).json({ message: "Incorrect password" });
        }

        const token = jwt.sign(
            { userId: user[0].id, username: user[0].username }, 
            SECRET_KEY, 
            { expiresIn: '2h' }
        );

        res.status(200).json({ message: "Login successful" , token});
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }


});

module.exports = router;