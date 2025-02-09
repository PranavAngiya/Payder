# Payder

**AI-Powered Trading Simulator**

Welcome to **Payder**, an AI-powered trading simulator designed to help users simulate and test trading strategies in a dynamic market environment.

---

## Website Planning

For an in-depth look at our website planning and design strategy, please refer to our detailed [Google Docs Website Planning Document](https://docs.google.com/document/d/1LZNU5HSjNwkSa0gHM6_UC7K3pLeR-8Uok0LVjuEJgH0/edit?usp=sharing).

---

## Configuration

If you encounter incorrect port issues or need to change the SQL server port, you can resolve this by creating a `my.cnf` file in the `/etc/` directory with the following configuration:

```ini
[mysqld]
port = 8080
```
---

## Directory Structure:

```bash
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

```
