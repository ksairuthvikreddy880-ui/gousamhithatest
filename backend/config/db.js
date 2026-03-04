const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

// Test connection
pool.connect()
    .then(() => {
        console.log('✅ Connected to Neon PostgreSQL');
    })
    .catch(err => {
        console.error('❌ Database connection error:', err.message);
        console.error('Please check your DATABASE_URL in .env file');
    });

// Add getClient method for transaction support
pool.getClient = () => pool.connect();

module.exports = pool;
