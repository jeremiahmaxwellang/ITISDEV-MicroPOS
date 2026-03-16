require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

let mysql = require('mysql2/promise');

const mySqlPool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});
// password stored in /src/.env

module.exports = mySqlPool;