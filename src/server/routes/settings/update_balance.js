const express = require('express');
const db = require('../../db_setup');
require ('dotenv').config();

const router = express.Router();

router.post('/', async (req, res) => {

    const {username, dollar_bills} = req.body;

    console.log(`username: ${username}`);
    console.log(`dollar_bills: ${dollar_bills}`)

    try{
        //Check if fields are empty
        if(!username || !dollar_bills){
            return res.status(400).json({message: "Missing field(s) present."});
        }else{

            //All fields are properly filled
            //Retrieve user id and current account_balance
            let query = 'SELECT * FROM users WHERE username = ?';
            const user = await db.query(query, [username]);
            if(user.length === 0){
                return res.status(400).json({message: "There is no user with the provided username."});
            }

            const userID = user[0].id;
            const balance = user[0].account_balance;

            float_check = parseFloat(dollar_bills);

            if(isNaN(float_check)){
                //Data was not in float format
                return res.status(400).json({message: "The amount of money you wanted to add to your balance is not a float."});
            }else{

                //Test to see if amount you want to add is reasonable.
                if(float_check <= 0){
                    return res.status(400).json({message: "The amount of money you wanted to add to your balance is invalid."});
                }
                
                let more_monay = 0;
                more_monay = balance + float_check;
                query = 'UPDATE users SET account_balance = ? WHERE id = ?';
                await db.query(query, [more_monay, userID])
                return res.status(200).json({message: "Account balance successfully updated."});
            }

        }
    }catch(error){
        return res.status(500).json({message: error.message});
    }

});

module.exports = router;