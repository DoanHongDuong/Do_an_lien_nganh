const mysql = require('mysql2');
require('dotenv').config(); // Nếu bạn có dùng file .env

const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',      // Thay user của bạn
    password: 'hd15052k4',   // Thay pass của bạn
    database: 'do_an_lien_nganh',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// QUAN TRỌNG: Phải dùng pool.promise() để dùng được async/await trong server.js
const promisePool = pool.promise();

module.exports = promisePool;