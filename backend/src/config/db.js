// backend/src/config/db.js
const knex = require('knex');

const db = knex({
  client: 'pg',
  connection: process.env.DATABASE_URL || 'postgres://admin:password123@localhost:5432/cms_core',
  pool: { min: 2, max: 10 } // Connection pool for performance
});

module.exports = db;