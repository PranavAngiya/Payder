const app = require('../server');
const request = require('./supertest');

//This is the test suite for the api request routes
describe('Buying share(s) using balance route should', ()=>{

    it('give 400 message if missing field(s) present.', async()=>{

    });

    it('give 400 message if no user around with given username.', async()=>{

    });

    it('give 400 message if quantity supplied by user is unreasonable.', async()=>{

    });

    it('give 400 message if the price for a share is unreasonable.', async()=>{

    });

    it('give 400 message if you already have 200 different companies shares in your portfolio.', async()=>{

    });

});

describe('Buying share(s) using manual payment route should', ()=>{

    it('give 400 message if missing field(s) present.', async()=>{

    });

    it('give 400 message if no user around with given username.', async()=>{

    });

    it('give 400 message if quantity supplied by user is unreasonable.', async()=>{

    });

    it('give 400 message if month is not an integer value.', async()=>{

    });

    it('give 400 message if month value supplied does not actually correspond to an actual month on the calendar.', async()=>{

    });

    it('give 400 message if year is not an integer value.', async()=>{

    });

    it('give 400 message whenever the expiration of your card exceeds the current date.', async()=>{

    });

    it('give 400 message if client tries to buy shares in a new company whenever he already has a full portfolio (20 companies)', async()=>{

    });

});

describe('Selling share(s) using selling route should', ()=>{

    it('give 400 message if missing field(s) present.', async()=>{

    });

    it('give 400 message if quantity supplied by user is unreasonable.', async()=>{

    });

    it('give 400 message if the price for a share is unreasonable.', async()=>{

    });

    it('give 400 message if you have no stocks to sell.', async()=>{

    });

    it('give 400 message if you do not have any stock in the company that you are trying to sell from.', async()=>{

    });

    it('give 400 message if the quantity of shares that you tried the sell exceeds the number of shares in a company you currently have in your possession.', async()=>{

    });

});

