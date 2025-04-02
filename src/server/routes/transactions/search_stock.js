const express = require('express');
const db = require('../../db_setup');
const yahooFinance = require('yahoo-finance2');
require ('dotenv').config();

const router = express.Router();

//Retrieve historical data
router.post('/', async (req, res) => {

    const {ticker} = req.body;

    try{

        //Check if ticker is missing field
        if(!ticker){
            return res.status(400).json({message: "Missing ticker."});
        }

        //Check if bad ticker symbol is given
        if(ticker.length > 5 || ticker.length < 2){
            return res.status(400).json({message: "Invalid ticker symbol given."});
        }

        //Get current data
        var today = new Date()
        var three_days_ago = new Date()
        three_days_ago.setDate(three_days_ago.getDate() - 7);

        //Convert to yyyy-mm-dd format
        today.toISOString().split('T')[0];
        three_days_ago.toISOSString().split('T')[0];

        const queryOptions = {
            period1: three_days_ago,    //Start datae
            period2: today,             //End date
            interval: "1d"              //Increment
        };

        const historical_data = await yahooFinance.historical(symbol, queryOptions);

        if(!historical_data || historical_data.length === 0){
            return res.status(400).json({message: "No data for this ticker symbol."});
        }

        return res.status(200).json(historical_data)

    }catch(error){
        return res.status(500).json({message: error.message});
    }

});

module.exports = router;