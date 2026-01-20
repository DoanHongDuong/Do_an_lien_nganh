const mysql = require('mysql2');
require('dotenv').config(); // Nếu bạn có dùng file .env

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',      // Thay user của bạn
    password: process.env.DB_PASSWORD || '',  // Thay pass của bạn
    database: process.env.DB_NAME || 'do_an_lien_nganh',
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// QUAN TRỌNG: Phải dùng pool.promise() để dùng được async/await trong server.js
const promisePool = pool.promise();

module.exports = promisePool;