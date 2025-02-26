-- Create the database and use it
CREATE DATABASE IF NOT EXISTS payder;
USE payder;

-- Create the users table
CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        full_name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        username VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        account_balance DECIMAL(15,2) DEFAULT 0.00
    );