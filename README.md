# Payder

**AI-Powered Trading Simulator**

Welcome to **Payder**, an AI-powered trading simulator designed to help users simulate and test trading strategies in a dynamic market environment.
* A realistic practice environment for buying, selling, and tracking stocks
* Secure user authentication with JWT and bcrypt hashing
* Dynamic portfolio lookup and account balance management
* Customizable settings: update email, password, username, balance, and trading sentiment
* Modular codebase ready for AI-driven trading bots and real-time market integrations

---

## Configuration

If you encounter incorrect port issues or need to change the SQL server port, you can resolve this by creating a `my.cnf` file in the `/etc/` directory with the following configuration:

```ini
[mysqld]
port = 8080
```
---

## Environment Variables

Create a `.env` file in the `/src/server/` directory with the following environment variables:

```bash
DB_HOST=
DB_PORT=
DB_USER=
DB_PASSWORD=
DB_NAME=
JWT_SECRET_KEY=
```

These variables configure the server port, database connection, and JWT secret key.

---

## Directory Structure:

```bash
/src
├── client/                        # Frontend (HTML, CSS, JS)
│   ├── pages/                     # Entry & feature-specific HTML
│   │   ├── entry_pages/
│   │   │   ├── login.html
│   │   │   ├── passwordReset.html
│   │   │   ├── signup.html
│   │   ├── portfolio/
│   │   │   ├── lookup.html
│   │   │   ├── userHome.html
│   │   ├── settings/
│   │   │   ├── accountConfig.html
│   │   │   ├── finance.html
│   │   │   ├── sentiment.html
│   │   │   ├── settings.html
│   │   │   ├── error.html
│   ├── styles/                    # CSS files
│   │   ├── accountConfig.css
│   │   ├── finance.css
│   │   ├── home.css
│   │   ├── login.css
│   │   ├── lookup.css
│   │   ├── passwordReset.css
│   │   ├── sentiment.css
│   │   ├── settings.css
│   │   ├── signup.css
│   ├── scripts/                   # JavaScript modules
│   │   ├── apis/
│   │   │   ├── update_finance.js
│   │   │   ├── update_sentiment.js
│   │   ├── auth/
│   │   │   ├── login.js
│   │   │   ├── signup.js
│   │   ├── pages/
│   │   │   ├── userHome.js
│   │   ├── utils/
│   │   │   ├── authCheck.js
│   │   │   ├── error.js
│   │   ├── api.js                # central API request helper
├── server/                        # Backend (Express API)
│   ├── jobs/
│   │   ├── logUserValue.js
│   ├── middleware/
│   │   ├── authMiddleware.js
│   ├── routes/
│   │   ├── api/
│   │   │   ├── apiIndex.js
│   │   │   ├── balance.js
│   │   │   ├── list_portfolio.js
│   │   │   ├── trader.js
│   │   │   ├── userValue.js
│   │   ├── auth/
│   │   │   ├── authIndex.js
│   │   │   ├── login.js
│   │   │   ├── signup.js
│   │   │   ├── set_sentiment.js
│   │   ├── settings/
│   │   │   ├── settingsIndex.js
│   │   │   ├── update_balance.js
│   │   │   ├── update_email.js
│   │   │   ├── update_password.js
│   │   │   ├── update_sentiment.js
│   │   │   ├── update_username.js
│   │   ├── transactions/
│   │   │   ├── buy_balance.js
│   │   │   ├── buy_manual.js
│   │   │   ├── search_stock.js
│   │   │   ├── sell.js
│   │   │   ├── routesIndex.js
│   ├── db_setup.js               # MySQL connection & promisified queries
│   ├── schema.sql                # Database schema
│   ├── server.js                 # Main Express server
├── .env                          # Environment variables
├── package.json                  # Scripts & dependencies
├── README.md                     # Project README (this file)
└── Payder_Logo.heic              # Logo asset

```

## Running the Full Stack

Start MySQL, then:

```bash
# In project root:
npm run dev       # launch backend with nodemon

# In client directory:
cd src/client
npx serve .       # serve frontend on default port
```

Open your browser to:

```bash
http://127.0.0.1:5500/src/client/pages/entry_pages/login.html
```

---