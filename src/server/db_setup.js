require('dotenv').config();
const mysql = require('mysql2');
const util = require('util');

// Extract environment variables
const{ DB_HOST, 
        DB_PORT, 
        DB_USER, 
        DB_PASSWORD, 
        DB_NAME 
    } = process.env;

// Create a MySQL connection
const db = mysql.createConnection({     
    host: DB_HOST,
    port: DB_PORT,  
    user: DB_USER, 
    password: DB_PASSWORD, 
});
db.connect( (err) => {
    if (err){
        console.error('Error connecting to MySQL database:', err);
        process.exit(1);
    }

    console.log('Connected to MySQL database.');
});

// Create the database if it doesn't exist
const createDatabaseQuery = 'CREATE DATABASE IF NOT EXISTS ' + DB_NAME;
db.query(createDatabaseQuery, (err) => {
    if (err){
        console.error('Error creating database:', err);
        process.exit(1);
    }
    console.log('Database has been found or it has been created');
});

// Create a query function that uses promises
db.query = util.promisify(db.query);

// Use the database
db.query('USE ' + DB_NAME);

// Ensure the users table exists
const createUsersTable = `
    CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        full_name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        username VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        account_balance DECIMAL(15,2) DEFAULT 0.00
    )`;
db.query(createUsersTable, err => {
    if (err){
        console.error('Error creating users table:', err);
        process.exit(1);
    };
    console.log("Users table verified");
});


module.exports = db;