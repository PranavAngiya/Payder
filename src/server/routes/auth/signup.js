const express = require('express');
const bcrypt = require('bcrypt');
const db = require('../../db_setup');

const router = express.Router();

router.post('/', async (req, res) => {
    const { full_name, email, username, password } = req.body;
    
    // Make sure the fields are not empty

    if (!full_name || !email || !username || !password) {
        return res.status(400).json({ message: "All required fields must be filled!" });
    }

    // Check to see if username or email already exists

    try{
        const checkQuery = 'SELECT * FROM users WHERE username = ? OR email = ?';

        const existingUser = await db.query(checkQuery, [username, email]);

        if (existingUser.length > 0) {
            if (existingUser[0].username === username) {
                return res.status(400).json({ message: "Username already exists!" });
            } else if (existingUser[0].email === email) {
                return res.status(400).json({ message: "Email already exists!" });
            }

        }

        // Hash the password
        const salt = await bcrypt.genSalt(12);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Insert user into database
        const insertuserQuery = 'INSERT INTO users (full_name, email, username, password) VALUES (?, ?, ?, ?)';
        await db.query(insertuserQuery, [full_name, email, username, hashedPassword]);
        res.status(200).json({ message: 'User inserted successfully' });
    } 
    catch (error) {
        res.status(500).json({ message: "Server error", error });
    }

});

module.exports = router;