const express = require('express');
const cors = require('cors');
const db = require('./src/db');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

/* ================= PRODUCTS ================= */

// GET all
app.get('/api/products', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM products');
        res.json(rows);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// ADD
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

// UPDATE
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

// DELETE
app.delete('/api/products/:id', async (req, res) => {
    try {
        await db.query('DELETE FROM products WHERE product_id=?', [req.params.id]);
        res.json({ message: 'Đã xoá' });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.listen(PORT, () =>
    console.log(`🚀 Backend chạy: http://localhost:${PORT}`)
);