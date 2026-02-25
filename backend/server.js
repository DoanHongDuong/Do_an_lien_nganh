const express = require('express');
const cors = require('cors');
const db = require('./src/db');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

/* ================= PRODUCTS (CRUD) ================= */

// GET all - Lấy danh sách
app.get('/api/products', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM products');
        res.json(rows);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});
app.get('/api/categories', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM categories');
        res.json(rows);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});
// ==========================================
// API QUẢN LÝ KHÁCH HÀNG
// ==========================================

// 1. Lấy danh sách khách hàng
app.get('/api/customers', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM customers ORDER BY customer_id DESC');
        res.json(rows);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// 2. Thêm khách hàng mới
app.post('/api/customers', async (req, res) => {
    try {
        const { customer_name, phone } = req.body;
        await db.query('INSERT INTO customers (customer_name, phone) VALUES (?, ?)', [customer_name, phone]);
        res.json({ message: 'Thêm khách hàng thành công' });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// 3. Sửa thông tin khách hàng
app.put('/api/customers/:id', async (req, res) => {
    try {
        const { customer_name, phone } = req.body;
        await db.query('UPDATE customers SET customer_name = ?, phone = ? WHERE customer_id = ?', 
            [customer_name, phone, req.params.id]);
        res.json({ message: 'Cập nhật thành công' });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// 4. Xóa khách hàng
app.delete('/api/customers/:id', async (req, res) => {
    try {
        await db.query('DELETE FROM customers WHERE customer_id = ?', [req.params.id]);
        res.json({ message: 'Đã xóa khách hàng' });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});
// ==========================================
// API QUẢN LÝ ĐƠN HÀNG
// ==========================================

// 1. Lấy danh sách đơn hàng (JOIN để lấy tên khách hàng)
app.get('/api/orders', async (req, res) => {
    try {
        const query = `
            SELECT o.order_id, c.customer_name, o.order_date, o.total_amount 
            FROM orders o
            JOIN customers c ON o.customer_id = c.customer_id
            ORDER BY o.order_id DESC
        `;
        const [rows] = await db.query(query);
        res.json(rows);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// 2. Tạo đơn hàng mới (Tự động trừ tồn kho)
app.post('/api/orders', async (req, res) => {
    const { customer_id, order_date, product_id, quantity } = req.body;
    try {
        // Lấy giá hiện tại của sản phẩm từ DB
        const [product] = await db.query('SELECT price FROM products WHERE product_id = ?', [product_id]);
        if (product.length === 0) return res.status(404).json({ error: 'Không tìm thấy sản phẩm' });
        const price = product[0].price;

        // Bắt đầu tạo đơn hàng (bảng orders)
        const [orderResult] = await db.query(
            'INSERT INTO orders (customer_id, order_date) VALUES (?, ?)', 
            [customer_id, order_date]
        );
        const newOrderId = orderResult.insertId; // Lấy ID của đơn hàng vừa tạo

        // Thêm chi tiết đơn hàng (bảng order_items) - Trigger của bạn sẽ tự tính total_amount
        await db.query(
            'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)',
            [newOrderId, product_id, quantity, price]
        );

        // Trừ đi số lượng tồn kho trong bảng products
        await db.query('UPDATE products SET stock = stock - ? WHERE product_id = ?', [quantity, product_id]);

        res.json({ message: 'Tạo đơn hàng thành công' });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// 3. Xoá đơn hàng (ON DELETE CASCADE sẽ tự xoá dữ liệu trong order_items)
app.delete('/api/orders/:id', async (req, res) => {
    try {
        await db.query('DELETE FROM orders WHERE order_id = ?', [req.params.id]);
        res.json({ message: 'Đã xóa đơn hàng' });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});
// ADD - Thêm mới
app.post('/api/products', async (req, res) => {
    const { product_name, category_id, price, stock, image_url } = req.body;
    try {
        await db.query(
            `INSERT INTO products (product_name, category_id, price, stock, image_url)
             VALUES (?, ?, ?, ?, ?)`,
            [product_name, category_id, price, stock, image_url]
        );
        res.json({ message: 'Thêm sản phẩm thành công' });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// UPDATE - Cập nhật
app.put('/api/products/:id', async (req, res) => {
    const { id } = req.params;
    const { product_name, category_id, price, stock, image_url } = req.body;

    try {
        await db.query(
            `UPDATE products 
             SET product_name=?, category_id=?, price=?, stock=?, image_url=?
             WHERE product_id=?`,
            [product_name, category_id, price, stock, image_url, id]
        );
        res.json({ message: 'Cập nhật thành công' });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// DELETE - Xóa
app.delete('/api/products/:id', async (req, res) => {
    try {
        await db.query('DELETE FROM products WHERE product_id=?', [req.params.id]);
        res.json({ message: 'Đã xoá' });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

/* ================= REPORTS (BÁO CÁO) ================= */

// API Báo cáo doanh thu
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

// API Top sản phẩm bán chạy
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

app.listen(PORT, () =>
    console.log(`🚀 Backend chạy: http://localhost:${PORT}`)
);