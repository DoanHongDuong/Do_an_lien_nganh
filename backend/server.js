// backend/server.js
const express = require('express');
const cors = require('cors');
const db = require('./src/db'); // Import file kết nối db

const app = express();
const PORT = 5000;

app.use(cors()); // Cho phép frontend gọi
app.use(express.json()); // Để đọc dữ liệu JSON gửi lên

// 1. API Lấy danh sách sản phẩm
app.get('/api/products', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM products');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 2. API Báo cáo doanh thu (Dùng câu SQL bạn đã viết)
app.get('/api/reports/revenue', async (req, res) => {
    try {
        const sql = `
            SELECT order_date, SUM(total_amount) AS revenue
            FROM orders
            GROUP BY order_date
            ORDER BY order_date DESC;
        `;
        const [rows] = await db.query(sql);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 3. API Top sản phẩm bán chạy (Dùng câu SQL bạn đã viết)
app.get('/api/reports/top-products', async (req, res) => {
    try {
        const sql = `
            SELECT p.product_name, SUM(oi.quantity) AS total_sold
            FROM order_items oi
            JOIN products p ON oi.product_id = p.product_id
            GROUP BY p.product_name
            ORDER BY total_sold DESC;
        `;
        const [rows] = await db.query(sql);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server đang chạy tại http://localhost:${PORT}`);
});