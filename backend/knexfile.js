// backend/knexfile.js
require('dotenv').config();

/**
 * @type { Object.<string, import("knex").Knex.Config> }
 */
module.exports = {

  development: {
    client: 'pg', // Changed from sqlite3 to pg
    connection: process.env.DATABASE_URL || {
      host: '127.0.0.1',      // Localhost (accessible because mapped ports in docker-compose)
      port: 5432,
      user: 'admin',          // Matches docker-compose.yml
      password: 'password123',// Matches docker-compose.yml
      database: 'cms_core'    // Matches docker-compose.yml
    },
    pool: {
      min: 2,
      max: 10
    },
    migrations: {
      directory: './src/db/migrations', // Keeps your folder structure clean
      tableName: 'knex_migrations'
    },
    seeds: {
      directory: './src/db/seeds'
    }
  },

  production: {
    client: 'pg',
    connection: process.env.DATABASE_URL, // Will come from Render/Railway env vars
    pool: {
      min: 2,
      max: 10
    },
    migrations: {
      directory: './src/db/migrations',
      tableName: 'knex_migrations'
    },
    seeds: {
      directory: './src/db/seeds'
    }
  }

};