const express = require('express');
const db = require('../../db_setup');
require ('dotenv').config();

const router = express.Router();

router.post('/', async (req, res) => {

    const {username, ticker, quantity, curr_price} = req.body;

    try{
        //Check if fields are empty
        if(!username || !ticker || !quantity || !curr_price){
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

            //Check whether the quantity of data is not unreasonable
            if (quantity <= 0){
                return res.status(400).json({message: "Invalid quantity given."});
            }

            //Check whether the current price per share is reasonable
            if(curr_price <= 0){
                return res.status(400).json({message: "Invalid current share price."});
            }

            //Create database query to check whether user already owns stock with ticker symbol
            query = 'SELECT * FROM portfolio LEFT JOIN users ON users.id = portfolio.f_id WHERE users.id = ?';
            const stocks = await db.query(query, [userID]);

            if(stocks.length === 0){

                //There are currently no stocks in your portfolio
                query = 'INSERT INTO portfolio (f_id, ticker, quantity) VALUES (?,?,?)';
                await db.query(query, [userID, ticker, quantity]);
                return res.status(200).json({message: "Transaction completed."});
                
            }else{ 
                
                //Check whether user has stock in question in their portfolio
                flag = 0;
                let stock_iter = Infinity;
                let num_stocks = stocks.length;
                for(i = 0; i < num_stocks; i++){
                    if (num_stocks[i].ticker === ticker){
                        stock_iter = i;
                        break;
                    }
                }
                //User does not own the stock in question
                if (stock_iter === Infinity){

                    //You cannot have more than 20 separate companies stocks in your portfolio
                    if (stocks.length === 20){
                        res.status(400).json({message: "You already have a full portfolio."});
                    }
                    
                    //Insert new purchased stock into your portfolio
                    query = 'INSERT INTO portfolio (f_id, ticker, quantity) VALUES (?,?,?)';
                    await db.query(query, [userID, ticker, quantity]);
                    balance -= quantity*curr_price;
                    return res.status(200).json({message: "Transaction completed."});

                }else{
                    //Update the quantity of shares that you currently have in your posession.
                    let shares_owned = num_stocks[stock_iter].quantity;
                    let portfolio_id = num_stocks[stock_iter].p_id;
                    shares_owned += quantity;
                    query = 'UPDATE portfolio SET quantity = ? WHERE p_id = ?';
                    const update_result = await db.query(query, [shares_owned, portfolio_id]);
                    return res.status(200).json({message: "Transaction completed."});
                    
                }
            }
        }
    }catch(error){
        return res.status(500).json({message: error});
    }

});

module.exports = router;