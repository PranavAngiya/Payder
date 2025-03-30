const express = require('express');
const db = require('../../db_setup');
require ('dotenv').config();

const router = express.Router();

function isInt(value) {
    return !isNaN(value) && parseInt(Number(value)) == value && !isNaN(parseInt(value, 10));
}

router.post('/', async (req, res) => {

    const {username, ticker, quantity, name, card_num, cvv, exp_month, exp_year} = req.body;

    //Get current month and year
    let curr_time = new Date();
    let curr_month = curr_time.getMonth() + 1;
    let curr_year = curr_time.getFullYear();

    try{
        //Check if fields are empty
        if(!username){
            return res.status(400).json({message: "No username field."});
        }else if(!ticker){
            return res.status(400).json({message: "No ticker field."})
        }else if(!quantity){
            return res.status(400).json({message: "No quantity field."})
        }else if(!name){
            return res.status(400).json({message: "No data in name field."});
        }else if(!card_num){
            return res.status(400).json({message: "No data in card_num field."});
        }else if(!cvv){
            return res.status(400).json({message: "No daata in cvv field."});
        }else if(!exp_month){
            return res.status(400).json({message: "No exp_month field."});
        }else if(!exp_year){
            return res.status(400).json({message: "No data in exp_year field."});
        }else{

            let query = 'SELECT * FROM users WHERE username = ?';
            const user = await db.query(query, [username]);
            if(user.length === 0){
                return res.status(400).json({message: "There is no user with the provided username."});
            }

            const userID = user.id;

            //Check whether the quantity of data is not unreasonable
            if (quantity <= 0){
                return res.status(400).json({message: "Invalid quantity given."});
            }

            //Validate whether the month given by the user is valid integer.
            if(!isInt(exp_month)){
                return res.status(400).json({message: "Month was not an integer value."})
            }
            //Check whether month is one of the 12 months of the year
            let flag = 0;
            for(let i = 1; i < 13; i++){
                if(exp_month === i){
                    flag = 1
                    break;
                }
            }
            if (flag !== 1){
                return res.status(400).json({messsage: "Month input does not correspond to possible months on record."});
            }

            //Validate whether year is an integer value
            if (!isInt(exp_year)){
                return res.status(400).json({message: "Year was not an integer value."});
            }

            //Check whether expiration has been surpased
            if(exp_year < curr_year){
                return res.status(400).json({message: "Expiration date has been surpased for your card."});
            }else if(exp_year === curr_year){
                if(exp_month <= curr_month){
                    return res.status(400).json({message: "Expiration date has been surpased for your card."})
                }
            }

            //Create database query to check whether user already owns stock with ticker symbol
            // (userID, ticker)
            query = 'SELECT * FROM portfolio LEFT JOIN users ON users.id = portfolio.f_id WHERE users.id = ?';
            const stocks = await db.query(query, [userID]);

            if(stocks.length === 20){
                res.status(400).json({message: "You already have a full portfolio."});
            }else if(stocks.length === 0){

                query = 'INSERT INTO portfolio (f_id, ticker, quantity) VALUES (?,?,?)';
                const update_result = await db.query(query, [userID, ticker, quantity]);
                if (update_result === 200){
                    return res.status(200).json({message: "Transaction completed."});
                }else{
                    return res.status(400).json({message: "Error in making transaction."})
                }
                
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

                    query = 'INSERT INTO portfolio (f_id, ticker, quantity) VALUES (?,?,?)';
                    const update_result = await db.query(query, [userID, ticker, quantity]);
                    if(update_result === 200){
                        return res.status(200).json({message: "Transaction completed."});
                    }else{
                        return res.status(400).json({message: "Error in making transaction."});
                    }

                }else{
                    //Update the quantity of shares that you currently have in your posession.
                    let shares_owned = num_stocks[stock_iter].quantity;
                    let portfolio_id = num_stocks[stock_iter].p_id;
                    shares_owned += quantity;
                    query = 'UPDATE portfolio SET quantity = ? WHERE p_id = ?';
                    const update_result = await db.query(query, [shares_owned, portfolio_id]);

                    if(update_result === 200){
                        return res.status(200).json({message: "Transaction completed."});
                    }else{
                        return res.status(400).json({message: "Error in making transaction."});
                    }
                }
            }
        }
    }catch(error){
        return res.status(500).json({message: error});
    }

});

module.exports = router;