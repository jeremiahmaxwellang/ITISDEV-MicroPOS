require('dotenv').config();

let mysql = require('mysql2/promise');

const mySqlPool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'micropos_db'
});
// password stored in .env file

module.exports = mySqlPool;