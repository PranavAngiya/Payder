const express = require('express');
const db = require('../../db_setup');
require ('dotenv').config();

const router = express.Router();

router.post('/', async (req, res) => {

    const {username, updated_risk_tolerance, updated_experience, updated_goals} = req.body;

    try{
        //Check if username or password fields are 
        if(!username || !updated_risk_tolerance || !updated_experience || !updated_goals){
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
            query = 'UPDATE sentiment SET tolerance = ?, experience = ?, goals = ? ON user.id = param.f_id WHERE user.id = ?';
            await db.query(query, [updated_email, userID]);
            return res.status(200).json({message: "Credentials updated."});

        }
    }catch(error){
        return res.status(500).json({message: error.message});
    }

});

module.exports = router;