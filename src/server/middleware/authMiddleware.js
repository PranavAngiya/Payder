// src/server/middleware/authMiddleware.js

// 1) Load .env here (or ensure this runs before your app uses the middleware)
require('dotenv').config();

const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET_KEY;

if (!JWT_SECRET) {
  console.error("⚠️  Missing JWT_SECRET in environment!");  // warn at startup
}

function authenticateToken(req, res, next) {
    // console.log("Authenticating token...");
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
        // console.log('Missing Authorization header');
        return res.status(401).json({ message: 'Missing Authorization header' });
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
        // console.log('Malformed Authorization header');
        return res.status(401).json({ message: 'Malformed Authorization header' });
    }

    const token = parts[1];
    // 2) Pass the actual secret you loaded
    // console.log(`Token: ${token}`);
    jwt.verify(token, JWT_SECRET, (err, payload) => {
        if (err) {
            // console.log('JWT verification error:', err);
            return res.status(401).json({ message: 'Invalid or expired token' });
        }
        console.log('JWT payload:', payload);
        req.user = payload;
        next();
    });
}

module.exports = authenticateToken;
