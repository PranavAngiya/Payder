const express = require('express');
const db = require('../../db_setup');
const yahooFinance = require('yahoo-finance2').default; //default is es so needed to add default
require ('dotenv').config();

const router = express.Router();

//Retrieve historical data
router.post('/', async (req, res) => {

    const {ticker} = req.body;
    console.log(ticker);

    try{

        //Check if ticker is missing field
        if(!ticker){
            return res.status(400).json({message: "Missing ticker."});
        }

        //Check if bad ticker symbol is given
        if(ticker.length > 5 || ticker.length < 1){
            return res.status(400).json({message: "Invalid ticker symbol given."});
        }

        //Get current data
        let today = new Date()
        let seven_days_ago = new Date()
        seven_days_ago.setDate(seven_days_ago.getDate() - 30);

        //Convert to yyyy-mm-dd format
        today = today.toISOString().split('T')[0];
        seven_days_ago = seven_days_ago.toISOString().split('T')[0];

        const queryOptions = {
            period1: seven_days_ago,    //Start date
            period2: today,             //End date
            interval: "1d"              //Increment
        };

        const historical_data = await yahooFinance.chart(ticker, queryOptions);

        if(!historical_data || historical_data.length === 0){
            return res.status(400).json({message: "No data for this ticker symbol."});
        }

        return res.status(200).json(historical_data)

    }catch(error){
        return res.status(500).json({message: error.message});
    }

});

module.exports = router;