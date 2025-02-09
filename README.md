# Payder
 AI-Powered Trading Simulator

Google Docs Link for Website Planning: https://docs.google.com/document/d/1LZNU5HSjNwkSa0gHM6_UC7K3pLeR-8Uok0LVjuEJgH0/edit?usp=sharing

To fix incorrect port issues and to change SQL server port, create my.cnf file in /etc/ and type the following information:
[mysqld]
port = 8080

Directory Structure:
/src
  ├── client/                  # Frontend (HTML, CSS, JS)
  │   ├── pages/               # HTML Files
  │   │   ├── signup.html
  │   │   ├── login.html
  │   │   ├── error.html       # Redirect page for critical errors
  │   ├── styles/              # CSS Files
  │   │   ├── login.css
  │   ├── scripts/             # JavaScript Code
  │   │   ├── api.js           # Handles API calls (GET, POST, etc.)
  │   │   ├── auth/
  │   │   │   ├── signup.js    # Handles signup form submission
  │   │   │   ├── login.js     # (Future) Handles login logic
  │   │   ├── utils/
  │   │   │   ├── error.js     # Handles global frontend errors
  ├── server/                  # Backend (Express API)
  │   ├── routes/              # Main routing directory
  │   │   ├── routesIndex.js   # Collects all API routes
  │   │   ├── auth/
  │   │   │   ├── authIndex.js # Collects all auth-related routes
  │   │   │   ├── signup.js    # Signup route logic
  │   │   │   ├── login.js     # (Future) Login route logic
  │   │   ├── api/
  │   │   │   ├── index.js     # Collects general API routes
  │   ├── db_setup.js          # MySQL Database Connection
  │   ├── server.js            # Main Express Server File
  ├── package.json             # Project dependencies and scripts
  ├── .env                     # (Optional) Stores environment variables
  ├── README.md                # (Optional) Documentation
