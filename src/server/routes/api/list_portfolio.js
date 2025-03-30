const express = require('express');
const db = require('../../db_setup');

const router = express.Router();

router.post('/', async (req, res) => {
    
    const { username } = req.body;

    try{

        //Check if field is empty
        if (!username) {
            return res.status(400).json({ message: "All required fields must be filled!" });
        }

        //Get the user information
        let query = 'SELECT * FROM users WHERE username = ?';
        const user = await db.query(balanceQuery, [username]);

        //Check if there is an actual user present in the databse specified by given username
        if (user.length === 0) {
            return res.status(400).json({ message: 'User not found' });
        }

        //Amass list of all shares that a user owns
        let user_id = user[0].id;
        query = 'SELECT * FROM portfolio LEFT JOIN users ON users.id = portfolio.f_id WHERE users.id = ?';
        let data = await db.query(query, [user_id]);
        return res.status(200).json({message: data});

    } catch (error) {
        console.error('Error retrieving portfolio list:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
    
});

module.exports = router;

