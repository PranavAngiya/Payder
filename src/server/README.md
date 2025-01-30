This is used to run the server that will communicate with not just the front-end webapplication but also the python scripts.
Packages and their Use:
1. Nodemon: This is used to update the server as any changes are saved to the javascript file without having to relaunch the server. 
2. Express: This is used to host the server on a given port
3. Bcrypt: Encryption package to securely store the password to the SQL Database

To fix incorrect port issues and to change SQL server port, create my.cnf file in /etc/ and type the following information:
[mysqld]
port = 8080


Run the following script to initialize database

CREATE DATABASE IF NOT EXISTS myapp;

USE myapp;

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
);


To run the server, type "npx nodemon server.js"
