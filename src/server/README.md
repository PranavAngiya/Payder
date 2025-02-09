# Payder - Backend Server

This directory contains the backend server responsible for handling API requests, database interactions, and user authentication. It communicates with both the **front-end web application** and **Python scripts** for AI-powered trading operations.

## Features
- **User Authentication**: Secure login and signup using **JWT & bcrypt**.
- **REST API**: Serves as the backend API for the trading simulator.
- **Database Management**: Connects with MySQL to store user data.
- **Cross-Origin Resource Sharing (CORS)**: Enables frontend-backend communication.

## Installed Packages & Their Use
|        Package         |                                      Purpose                                        |
|------------------------|-------------------------------------------------------------------------------------|
|      **Nodemon**       | Auto-restarts the server when file changes are detected.                            |
|      **Express**       | Runs the backend server and handles HTTP requests.                                  |
|       **Bcrypt**       | Securely hashes and verifies user passwords.                                        |
|       **Dotenv**       | Manages environment variables securely.                                             |
|        **Cors**        | Enables the frontend (running on a different port) to communicate with the backend. |
|       **MySQL2**       | Manages MySQL database connections and queries.                                     |
| **jsonwebtoken (JWT)** | Creates authentication tokens for secure user sessions.                             |

## 🚀 Running the Server
To start the development server with automatic reload on file changes:
npm run dev

To start the server in production mode:

npm start

## Environment Variables (.env File)
To configure sensitive data, create a .env file inside the server/ directory:

## Directory Structure (Server)

/server
  ├── routes/              # Main API routes directory
  │   ├── routesIndex.js   # Collects all API routes
  │   ├── auth/
  │   │   ├── authIndex.js # Collects all auth-related routes
  │   │   ├── signup.js    # Signup API logic
  │   │   ├── login.js     # Login API logic (JWT authentication)
  │   ├── api/
  │   │   ├── index.js     # Collects general API routes
  │   │   ├── trading.js   # (Future) Handles trading-related requests
  │   ├── middleware/
  │   │   ├── authMiddleware.js # Protects API routes with JWT authentication
  │   ├── db_setup.js      # MySQL Database Connection
  │   ├── server.js        # Main Express Server File


## 🛠️ API Endpoints

Authentication (/server/auth)
_____________________________________________________________________________
|  Method  |       Endpoint       |              Description                 |
|----------|----------------------|------------------------------------------|
| **POST** |  /server/auth/signup |           Registers a new user           |
| **POST** |  /server/auth/login  |  Logs in a user and returns a JWT token  |


