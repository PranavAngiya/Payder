// src/server/routes/uservalue.js
const express = require('express');
const db      = require('../../db_setup');
const authenticateToken = require('../../middleware/authMiddleware');
const router  = express.Router();

router.use(authenticateToken);

// Helper to compute period start
function getPeriodStart(range) {
  const now = new Date();
  switch(range) {
    case '1d':
      now.setDate(now.getDate() - 1);
      break;
    case '1w':
      now.setDate(now.getDate() - 7);
      break;
    case '1m':
      now.setMonth(now.getMonth() - 1);
      break;
    case '1y':
      now.setFullYear(now.getFullYear() - 1);
      break;
    default:
      now.setDate(now.getDate() - 1);
  }
  return now.toISOString().slice(0,19).replace('T',' ');
}

router.get('/', async (req, res) => {
  const uid = req.user?.userId;         // assume authCheck has populated req.user
  const range = req.query.range || '1d';
  if (!uid) return res.status(401).json({ message: 'Not authenticated' });

  const since = getPeriodStart(range);

  try {
    const rows = await db.query(
      `SELECT timestamp, total_value
         FROM uservalue
        WHERE user_id = ?
          AND timestamp >= ?
        ORDER BY timestamp ASC`,
      [uid, since]
    );
    return res.json({ success: true, data: rows });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: err.message });
  }
});

module.exports = router;
