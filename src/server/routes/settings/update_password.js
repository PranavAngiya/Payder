const express = require('express');
const bcrypt = require('bcrypt');
const db = require('../../db_setup');
require ('dotenv').config();

const router = express.Router();

router.post('/', async (req, res) => {

    const {username, updated_password} = req.body;

    try{
        //Check if username or password fields are 
        if(!username || !updated_password){
            return res.status(400).json({message: "Missing field(s) present."});
        }else{

            //Get a user through their username
            let query = 'SELECT * FROM users WHERE username = ?';
            const user = await db.query(query, [username]);
            if(user.length === 0){
                return res.status(400).json({message: "There is no user with the provided username."});
            }

            const userID = user[0].id;

            //Update the credentials through the user_id
            query = 'UPDATE users SET password = ? WHERE id = ?';

            // Hash the password
            const salt = await bcrypt.genSalt(12);
            const hashedPassword = await bcrypt.hash(updated_password, salt);

            await db.query(query, [hashedPassword, userID]);
            return res.status(200).json({message: "Password updated."});

        }
    }catch(error){
        return res.status(500).json({message: error});
    }

});