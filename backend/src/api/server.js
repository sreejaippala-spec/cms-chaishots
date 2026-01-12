const app = require('./app');
const db = require('../config/db');

const PORT = process.env.PORT || 3000;

// Test DB connection before starting
db.raw('SELECT 1')
  .then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 API Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to connect to database:', err);
    process.exit(1);
  });