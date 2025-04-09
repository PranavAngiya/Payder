const app = require('../server');
const request = require('./supertest');

//This is the test suite for the api request routes
describe('Update balance path should', ()=>{

    it('give 400 message if missing field(s) are present.', async()=>{

    });

    it('give 400 message if the amount that the client wants to add is not a float.', async()=>{

    });

});

describe('Update credentials path should', ()=>{

    it('give 400 message if missing field(s) are present.', async()=>{

    });

    it('give 400 message if username already taken.', async()=>{

    });

});

describe('Update email path should', ()=>{

    it('give 400 message if missing field(s) are present.', async()=>{

    });

    it('give 400 message if email already taken.', async()=>{

    });


});

describe('Update sentiment data path should', ()=>{

    it('give 400 message if missing field(s) are present.', async()=>{

    });

    it('give 400 if there is no user with provided username.', async()=>{

    });

});

