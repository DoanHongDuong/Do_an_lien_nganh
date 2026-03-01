const express = require('express');
const cors = require('cors');
const db = require('./src/db');
const revenueRoutes = require('./routes/revenue');
const app = express();
const PORT = 5000;
const multer = require('multer');
const path = require('path');
const fs = require('fs');
app.use(cors());
app.use(express.json());
const uploadDir = 'uploads';
if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir);
    console.log('Đã tạo thư mục uploads');
}
// 1. CẤU HÌNH UPLOAD ẢNH (MULTER)
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/'); // Lưu vào thư mục uploads
    },
    filename: function (req, file, cb) {
        // Đặt tên file = thời gian + đuôi file gốc
        const uniqueSuffix = Date.now() + path.extname(file.originalname);
        cb(null, uniqueSuffix);
    }
});
const upload = multer({ storage: storage });

// 2. MỞ CÔNG KHAI FOLDER UPLOADS (Chỉ cần khai báo 1 lần)
app.use('/uploads', express.static('uploads'));

// 3. ĐĂNG KÝ ROUTE PHỤ
app.use('/api/revenue', revenueRoutes);


// ==========================================
// API 1: ĐĂNG NHẬP & QUẢN LÝ NHÂN VIÊN
// ==========================================
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const query = 'SELECT * FROM users WHERE username = ? AND password = ?';
        const [rows] = await db.query(query, [username, password]);

        if (rows.length > 0) {
            const user = rows[0];
            const { password: _, ...userInfo } = user;
            res.json({ success: true, user: userInfo });
        } else {
            res.status(401).json({ success: false, message: 'Sai tài khoản hoặc mật khẩu!' });
        }
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.get('/api/users', async (req, res) => {
    try {
        const [rows] = await db.query("SELECT user_id, full_name, username, role, salary FROM users WHERE role != 'admin'");
        res.json(rows);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/users', async (req, res) => {
    const { full_name, username, password, salary } = req.body;
    try {
        await db.query(
            "INSERT INTO users (full_name, username, password, role, salary) VALUES (?, ?, ?, 'staff', ?)",
            [full_name, username, password, salary]
        );
        res.json({ message: 'Thêm nhân viên thành công' });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.put('/api/users/:id', async (req, res) => {
    const { full_name, salary } = req.body;
    try {
        await db.query(
            "UPDATE users SET full_name = ?, salary = ? WHERE user_id = ?",
            [full_name, salary, req.params.id]
        );
        res.json({ message: 'Cập nhật thành công' });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.delete('/api/users/:id', async (req, res) => {
    try {
        await db.query("DELETE FROM users WHERE user_id = ?", [req.params.id]);
        res.json({ message: 'Đã xóa nhân viên' });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});


// ==========================================
// API 2: QUẢN LÝ KHÁCH HÀNG
// ==========================================
app.get('/api/customers', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM customers ORDER BY customer_id DESC');
        res.json(rows);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/customers', async (req, res) => {
    try {
        const { customer_name, phone } = req.body;
        await db.query('INSERT INTO customers (customer_name, phone) VALUES (?, ?)', [customer_name, phone]);
        res.json({ message: 'Thêm khách hàng thành công' });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/customers/:id', async (req, res) => {
    try {
        const { customer_name, phone } = req.body;
        await db.query('UPDATE customers SET customer_name = ?, phone = ? WHERE customer_id = ?',
            [customer_name, phone, req.params.id]);
        res.json({ message: 'Cập nhật thành công' });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/customers/:id', async (req, res) => {
    try {
        await db.query('DELETE FROM customers WHERE customer_id = ?', [req.params.id]);
        res.json({ message: 'Đã xóa khách hàng' });
    } catch (e) { res.status(500).json({ error: e.message }); }
});


// ==========================================
// API 3: QUẢN LÝ SẢN PHẨM (ĐÃ SỬA CHUẨN)
// ==========================================

// Lấy danh sách sản phẩm
app.get('/api/products', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM products');
        res.json(rows);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// Lấy danh sách danh mục
app.get('/api/categories', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM categories');
        res.json(rows);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// THÊM SẢN PHẨM (CÓ ẢNH)
// Lưu ý: Đã xóa đoạn code thừa, chỉ giữ lại đoạn có upload.single
app.post('/api/products', upload.single('image'), async (req, res) => {
    const { product_name, category_id, price, stock } = req.body;
    let image_url = "";

    try {
        if (req.file) {
            // Nếu có file ảnh, tạo đường dẫn đầy đủ
            image_url = `http://localhost:${PORT}/uploads/${req.file.filename}`;
        } else {
            // Nếu không up ảnh, dùng ảnh mặc định
            image_url = "https://via.placeholder.com/150";
        }

        await db.query(
            `INSERT INTO products (product_name, category_id, price, stock, image_url) VALUES (?, ?, ?, ?, ?)`,
            [product_name, category_id, price, stock, image_url]
        );
        res.json({ message: 'Thêm sản phẩm thành công' });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: e.message });
    }
});

// SỬA SẢN PHẨM (CÓ THỂ UPDATE ẢNH HOẶC KHÔNG)
app.put('/api/products/:id', upload.single('image'), async (req, res) => {
    const { id } = req.params;
    const { product_name, category_id, price, stock } = req.body;
    
    try {
        // Nếu người dùng chọn file mới
        if (req.file) {
            const image_url = `http://localhost:${PORT}/uploads/${req.file.filename}`;
            await db.query(
                `UPDATE products SET product_name=?, category_id=?, price=?, stock=?, image_url=? WHERE product_id=?`,
                [product_name, category_id, price, stock, image_url, id]
            );
        } else {
            // Nếu không chọn file mới (giữ ảnh cũ)
            await db.query(
                `UPDATE products SET product_name=?, category_id=?, price=?, stock=? WHERE product_id=?`,
                [product_name, category_id, price, stock, id]
            );
        }
        res.json({ message: 'Cập nhật thành công' });
    } catch (e) { 
        console.error(e);
        res.status(500).json({ error: e.message }); 
    }
});

// Xóa sản phẩm
app.delete('/api/products/:id', async (req, res) => {
    try {
        await db.query('DELETE FROM products WHERE product_id=?', [req.params.id]);
        res.json({ message: 'Đã xoá sản phẩm' });
    } catch (e) { res.status(500).json({ error: e.message }); }
});


// ==========================================
// API 4: QUẢN LÝ ĐƠN HÀNG
// ==========================================
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
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/orders', async (req, res) => {
    const { customer_id, product_id, quantity, order_date } = req.body;
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        const [rows] = await connection.query("SELECT stock, price FROM products WHERE product_id = ?", [product_id]);
        if (rows.length === 0) throw new Error("Sản phẩm không tồn tại");
        const product = rows[0];
        if (quantity > product.stock) {
            throw new Error(`Kho chỉ còn ${product.stock}, không đủ bán ${quantity}!`);
        }
        const total_amount = product.price * quantity;
        const [orderResult] = await connection.query(
            "INSERT INTO orders (customer_id, order_date, total_amount) VALUES (?, ?, ?)",
            [customer_id, order_date, total_amount]
        );
        const newOrderId = orderResult.insertId;
        await connection.query(
            "INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)",
            [newOrderId, product_id, quantity, product.price]
        );
        await connection.query(
            "UPDATE products SET stock = stock - ? WHERE product_id = ?",
            [quantity, product_id]
        );
        await connection.commit();
        res.json({ message: "Tạo đơn hàng thành công!", order_id: newOrderId });
    } catch (error) {
        await connection.rollback();
        res.status(400).json({ error: error.message });
    } finally {
        connection.release();
    }
});


// ==========================================
// API 5: DASHBOARD & KHÁC
// ==========================================
app.put('/api/change-password', async (req, res) => {
    const { username, old_password, new_password } = req.body;
    try {
        const [users] = await db.query("SELECT * FROM users WHERE username = ? AND password = ?", [username, old_password]);
        if (users.length === 0) {
            return res.status(401).json({ success: false, message: "Mật khẩu cũ không đúng!" });
        }
        await db.query("UPDATE users SET password = ? WHERE username = ?", [new_password, username]);
        res.json({ success: true, message: "Đổi mật khẩu thành công!" });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.get('/api/dashboard/stats', async (req, res) => {
    try {
        const [revenue] = await db.query("SELECT SUM(total_amount) as total FROM orders");
        const [orders] = await db.query("SELECT COUNT(*) as count FROM orders");
        const [customers] = await db.query("SELECT COUNT(*) as count FROM customers");

        res.json({
            revenue: revenue[0].total || 0,
            orders: orders[0].count || 0,
            customers: customers[0].count || 0
        });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.get('/api/dashboard/top-products', async (req, res) => {
    try {
        const query = `
            SELECT 
                p.product_name, 
                p.image_url,
                SUM(oi.quantity) as total_sold,
                SUM(oi.quantity * oi.price) as total_revenue
            FROM order_items oi
            JOIN products p ON oi.product_id = p.product_id
            GROUP BY p.product_id, p.product_name, p.image_url
            ORDER BY total_sold DESC
            LIMIT 5
        `;
        const [rows] = await db.query(query);
        res.json(rows);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// START SERVER
app.listen(PORT, () =>
    console.log(`🚀 Backend đang chạy tại: http://localhost:${PORT}`)
);