const express = require('express');
const db = require('../../db_setup');
require ('dotenv').config();

const router = express.Router();

function isFloat(n) {
    return n === +n && n !== (n|0);
}

router.post('/', async (req, res) => {

    const {username, dollar_bills} = req.body;

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

            //Test to see if amount you want to add is reasonable.
            if(dollar_bills <= 0){
                return res.status(400).json({message: "The amount of money you wanted to add to your balance is invalid."});
            }

            if(isFloat(dollar_bills)){
                
                let more_monay = 0;
                more_monay = balance + dollar_bills;
                query = 'UPDATE users SET account_balance = ? WHERE user.id = ?';
                await db.query(query, [more_monay, userID])
                return res.status(200).json({message: "Account balance successfully updated."});
                
            }else{
                return res.status(400).json({message: "The amount of money you wanted to add to your balance is not a float."})
            }


        }
    }catch(error){
        return res.status(500).json({message: error.message});
    }

});

module.exports = router;