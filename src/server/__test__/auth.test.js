const app = require('../server');
const request = require('./supertest');

//This is the test suite for the auth request routes
describe('Login path should', ()=>{

    it('give 400 error when username or password is missing.', async()=>{

    });

    it('give 400 error when user is not found.', async()=>{

    });

    it('give 400 error when password does not match one on file.', async()=>{

    });

});

describe('Sign up path should', ()=>{

    it('give 400 error whenever full_name, email, username, or password field not supplied.', async()=>{

    });

    it('give 400 message if there is already a user with the given username.', async()=>{

    });

    it('give 400 message if there is already a user with the given email.', async()=>{

    });

});


