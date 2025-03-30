const express = require('express');
const db = require('../../db_setup');
require ('dotenv').config();

const router = express.Router();

router.post('/', async (req, res) => {

    const {username, ticker, quantity, curr_price} = req.body;

    try{
        //Check if fields are empty
        if(!username){
            return res.status(400).json({message: "No username field."});
        }else if(!ticker){
            return res.status(400).json({message: "No ticker field."})
        }else if(!quantity){
            return res.status(400).json({message: "No quantity field."})
        }else if(!curr_price){
            return res.status(400).json({message: "No curr_price field."});
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
               return res.status(400).json({message: "You have no stocks to sell."});
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
                    return res.status(400).json({message: "You don't have this stock in your portfolio."});
                }else{
                    //Update the quantity of shares that you currently have in your posession.
                    let shares_owned = num_stocks[stock_iter].quantity;
                    let portfolio_id = num_stocks[stock_iter].p_id;

                    if(shares_owned < quantity){
                        return res.status(400).json({message: "The quantitty of shares that you've selected exceeds the current number of shares in your possession."});
                    }else if(shares_owned === quantity){

                        //Clear the stock so that the stock no longer appears in your list of managed stocks in your portfolio
                        query = 'DELTE FROM portfolio WHERE portfolio.p_id = ?';
                        const update_result = await db.query(query, [portfolio_id]);

                        if(update_result === 200){
                            //Update the balance
                            let updated_balance = balance + quantity*curr_price;
                            query = 'UPDATE users SET account_balance = ? WHERE user.id = ?';
                            update_result = await db.query(query, [updated_balance, userID]);
                            if(update_result === 200){
                                return res.status(200).json({message: "Account balance updated successfully."});
                            }else{
                                return res.status(400).json({message: "Account balance was not able to be updated."})
                            }
                        }else{
                            return res.status(400).json({message: "Error in making transaction."});
                        }

                    }else{

                        //Update number of shares in your portfolio directory
                        shares_owned -= quantity;
                        query = 'UPDATE portfolio SET quantity = ? WHERE p_id = ?';
                        const update_result = await db.query(query, [shares_owned, portfolio_id]);

                        if(update_result === 200){
                            //Update your current balance
                            let updated_balance = balance + quantity*curr_price;
                            query = 'UPDATE users SET account_balance = ? WHERE user.id = ?';
                            update_result = await db.query(query, [updated_balance, userID]);
                            return res.status(200).json({message: "Transaction completed."});
                        }else{
                            return res.status(400).json({message: "Error in making transaction."});
                        }

                    }
                }
            }
        }
    }catch(error){
        return res.status(500).json({message: error});
    }
});