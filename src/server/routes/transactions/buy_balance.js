const express = require('express');
const db = require('../../db_setup');
require ('dotenv').config();

const router = express.Router();

router.post('/', async (req, res) => {

    const {username, ticker, quantity, curr_price} = req.body;

    console.log(`username: ${username}`);
    console.log(`ticker: ${ticker}`);
    console.log(`quantity: ${quantity}`);
    console.log(`curr_price: ${curr_price}`);

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
            let balance = user[0].account_balance; // Use let as we might update it

            console.log(`userID: ${userID}`);
            console.log(`balance: ${balance}`);

            //Check whether the quantity of data is not unreasonable
            if (quantity <= 0){
                return res.status(400).json({message: "Invalid quantity given."});
            }

            //Check whether the current price per share is reasonable
            if(curr_price <= 0){
                return res.status(400).json({message: "Invalid current share price."});
            }

            // Calculate the total cost of the purchase
            const totalCost = quantity * curr_price;

            // Check if the user has sufficient balance
            if (balance < totalCost) {
                return res.status(400).json({ message: "Insufficient funds to complete the purchase." });
            }

            //Create database query to check whether user already owns stock with ticker symbol
            query = 'SELECT * FROM portfolio WHERE user_id = ?';
            const stocks = await db.query(query, [userID]);

            if(stocks.length === 0){

                //There are currently no stocks in your portfolio
                query = 'INSERT INTO portfolio (ticker, quantity, user_id, purchase_price) VALUES (?,?,?,?)';
                print(query);
                await db.query(query, [ticker, quantity, userID, curr_price]);

                // Update user's account balance
                balance -= totalCost;
                query = 'UPDATE users SET account_balance = ? WHERE id = ?';
                await db.query(query, [balance, userID]);

                return res.status(200).json({message: "Transaction completed."});

            }else{

                //Check whether user has stock in question in their portfolio
                let stock_iter = Infinity;
                for(let i = 0; i < stocks.length; i++){
                    if (stocks[i].ticker === ticker){
                        stock_iter = i;
                        break;
                    }
                }
                //User does not own the stock in question
                if (stock_iter === Infinity){

                    //You cannot have more than 20 separate companies stocks in your portfolio
                    if (stocks.length === 20){
                        return res.status(400).json({message: "You already have a full portfolio."});
                    }

                    //Insert new purchased stock into your portfolio
                    query = 'INSERT INTO portfolio (ticker, quantity, user_id, purchase_price) VALUES (?,?,?,?)';
                    await db.query(query, [ticker, quantity, userID, curr_price]);

                    // Update user's account balance
                    balance -= totalCost;
                    query = 'UPDATE users SET account_balance = ? WHERE id = ?';
                    await db.query(query, [balance, userID]);

                    return res.status(200).json({message: "Transaction completed."});

                }else{
                    //Update the quantity of shares that you currently have in your posession.
                    let shares_owned = stocks[stock_iter].quantity;
                    let portfolio_id = stocks[stock_iter].f_id;
                    shares_owned += quantity;
                    query = 'UPDATE portfolio SET quantity = ? WHERE f_id = ?';
                    await db.query(query, [shares_owned, portfolio_id]);

                    // Update user's account balance
                    balance -= totalCost;
                    query = 'UPDATE users SET account_balance = ? WHERE id = ?';
                    await db.query(query, [balance, userID]);

                    return res.status(200).json({message: "Transaction completed."});

                }
            }
        }
    }catch(error){
        return res.status(500).json({message: error.message});
    }

});

module.exports = router;