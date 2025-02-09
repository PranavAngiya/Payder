const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 8081;

// Connect frontend server to backend
app.use(cors());

// Middleware
app.use(express.json());

// Routes
const router = require('./routes/routesIndex');
app.use('/server', router);

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:` + PORT);
});
