const cron       = require('node-cron');
const { zonedTimeToUtc, utcToZonedTime } = require('date-fns-tz');
const db         = require('../db_setup');
const yf         = require('yahoo-finance2').default;

const TIME_ZONE = 'America/New_York';

function marketIsOpen(now = new Date()) {
  const zoned = utcToZonedTime(now, TIME_ZONE);
  const day = zoned.getDay();               // 0=Sun,1=Mon…5=Fri,6=Sat
  if (day === 0 || day === 6) return false; // weekend

  const hours = zoned.getHours();
  const mins  = zoned.getMinutes();
  // before 9:30?
  if (hours < 9 || (hours === 9 && mins < 30)) return false;
  // after 16:00?
  if (hours > 16 || (hours === 16 && mins > 0)) return false;
  return true;
}

async function fetchCurrentPrice(ticker) {
  try {
    const quote = await yf.quoteSummary(ticker, { modules: ['price'] });
    return quote.price.regularMarketPrice;
  } catch (e) {
    console.error(`Failed to fetch price for ${ticker}:`, e.message);
    return 0;
  }
}

async function logAllUsersValue() {
  const now = new Date();
  if (!marketIsOpen(now)) {
    console.log(`[${now.toISOString()}] Market closed — skipping log.`);
    return;
  }

  console.log(`[${new Date().toISOString()}] Starting portfolio value logging…`);

  // 1) get all users
  const users = await db.query('SELECT id, account_balance FROM users');

  for (let u of users) {
    const userId = u.id;
    let total = parseFloat(u.account_balance) || 0;

    // 2) get this user’s holdings
    const rows = await db.query(
      'SELECT ticker, quantity FROM portfolio WHERE user_id = ?',
      [userId]
    );

    // 3) for each holding, fetch live price & accumulate
    for (let { ticker, quantity } of rows) {
      const price = await fetchCurrentPrice(ticker);
      total += price * quantity;
    }

    // 4) insert into uservalue
    await db.query(
      'INSERT INTO uservalue (user_id, timestamp, total_value) VALUES (?, NOW(), ?)',
      [userId, total.toFixed(2)]
    );
    console.log(` → user ${userId}: logged $${total.toFixed(2)}`);
  }

  console.log('Portfolio value logging complete.\n');
}

// schedule to run at the top of every minute
cron.schedule('0 * * * * *', logAllUsersValue, {
  timezone: 'UTC'
});

// also export the function in case you want to call it manually
module.exports = { logAllUsersValue };
