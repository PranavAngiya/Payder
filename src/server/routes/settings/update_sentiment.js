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

            let experience = 0;
            let tolerance = 0;
            let goals = 0;

            //Associat experience field with int val
            if(updated_experience === "exp_low"){
                experience = 0;
            }else if(updated_experience === "exp_mid"){
                experience = 1;
            }else if(updated_experience === "exp_high"){
                experience = 2;
            }else{
                experience = 0;
            }

            //Associat tolerance field with int val
            if(updated_risk_tolerance === "exp_low"){
                tolerance = 0;
            }else if(updated_risk_tolerance === "exp_mid"){
                tolerance = 1;
            }else if(updated_risk_tolerance === "exp_high"){
                tolerance = 2;
            }else{
                tolerance = 0;  
            }

            //Associat goals field with int val
            if(updated_goals === "exp_low"){
                goals = 0;
            }else if(updated_goals === "exp_mid"){
                goals = 1;
            }else if(updated_goals === "exp_high"){
                goals = 2;
            }else{
                goals = 0;   
            }

            //Update the credentials through the user_id
            query = 'UPDATE sentiment SET tolerance = ?, experience = ?, goals = ? WHERE user_id = ?';
            await db.query(query, [tolerance, experience, goals, userID]);
            return res.status(200).json({message: "Credentials updated."});

        }
    }catch(error){
        return res.status(500).json({message: error.message});
    }

});

module.exports = router;