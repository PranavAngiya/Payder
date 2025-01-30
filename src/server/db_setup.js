const mysql = require('mysql2');

const db = mysql.createConnection({
    host: 'localhost',
    port: 8080,  // Update the port to 8080
    user: 'root', // Change if using a different user
    password: 'password', // Set your MySQL root password
    database: 'myapp' // Make sure this matches your database name
});

db.connect(err => {
    if (err) throw err;
    console.log('Connected to MySQL database.');

    // Ensure the users table exists
    const createUsersTable = `
        CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            full_name VARCHAR(100) NOT NULL,
            email VARCHAR(100) UNIQUE NOT NULL,
            username VARCHAR(50) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL,
            phone_number VARCHAR(20),
            experience_level ENUM('Beginner', 'Intermediate', 'Advanced') NOT NULL,
            investment_goals TEXT,
            account_balance DECIMAL(15,2) DEFAULT 0.00
        )
    `;

    db.query(createUsersTable, err => {
        if (err) throw err;
        console.log("Users table verified.");
    });
});

module.exports = db;