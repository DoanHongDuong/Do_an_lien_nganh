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

// ==========================================
// [MỚI] 0. MIDDLEWARE CHECK QUYỀN ADMIN
// ==========================================
const checkAdmin = (req, res, next) => {
    // Lấy role từ Header do Frontend gửi lên
    const userRole = req.headers['x-user-role']; 

    if (userRole === 'admin') {
        next(); // Là Admin -> Cho phép đi tiếp
    } else {
        res.status(403).json({ 
            success: false, 
            message: "Truy cập bị từ chối: Bạn không có quyền Admin!" 
        });
    }
};

const uploadDir = 'uploads';
if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir);
    console.log('📁 Đã tạo thư mục uploads');
}

// 1. CẤU HÌNH UPLOAD ẢNH (MULTER)
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/'); 
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + path.extname(file.originalname);
        cb(null, uniqueSuffix);
    }
});
const upload = multer({ storage: storage });

// 2. MỞ CÔNG KHAI FOLDER UPLOADS
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

// Ai cũng xem được danh sách (Hoặc thích thì thêm checkAdmin vào đây cũng được)
app.get('/api/users', async (req, res) => {
    try {
        const [rows] = await db.query("SELECT user_id, full_name, username, role, salary FROM users WHERE role != 'admin'");
        res.json(rows);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// [MỚI] Thêm nhân viên -> Phải là Admin
app.post('/api/users', checkAdmin, async (req, res) => {
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

// [MỚI] Sửa nhân viên -> Phải là Admin
app.put('/api/users/:id', checkAdmin, async (req, res) => {
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

// [MỚI] Xóa nhân viên -> Phải là Admin
app.delete('/api/users/:id', checkAdmin, async (req, res) => {
    try {
        await db.query("DELETE FROM users WHERE user_id = ?", [req.params.id]);
        res.json({ message: 'Đã xóa nhân viên' });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// [MỚI] API QUAN TRỌNG: Admin đổi mật khẩu nhân viên
app.put('/api/users/:id/change-password', checkAdmin, async (req, res) => {
    const { id } = req.params;
    const { new_password } = req.body;
    
    try {
        await db.query("UPDATE users SET password = ? WHERE user_id = ?", [new_password, id]);
        res.json({ success: true, message: "Đã đổi mật khẩu nhân viên thành công!" });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});


// ==========================================
// API 2: QUẢN LÝ KHÁCH HÀNG (Giữ nguyên)
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
// API 3: QUẢN LÝ SẢN PHẨM (Giữ nguyên)
// ==========================================
app.get('/api/products', async (req, res) => {
    try {
        // JOIN bảng categories để lấy cột category_name
        const query = `
            SELECT p.*, c.category_name 
            FROM products p
            JOIN categories c ON p.category_id = c.category_id
            ORDER BY p.product_id DESC
        `;
        const [rows] = await db.query(query);
        res.json(rows);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.get('/api/categories', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM categories');
        res.json(rows);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/products', upload.single('image'), async (req, res) => {
    const { product_name, category_id, price, stock } = req.body;
    let image_url = "";
    try {
        if (req.file) {
            image_url = `http://localhost:${PORT}/uploads/${req.file.filename}`;
        } else {
            image_url = "https://via.placeholder.com/150";
        }
        await db.query(
            `INSERT INTO products (product_name, category_id, price, stock, image_url) VALUES (?, ?, ?, ?, ?)`,
            [product_name, category_id, price, stock, image_url]
        );
        res.json({ message: 'Thêm sản phẩm thành công' });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.put('/api/products/:id', upload.single('image'), async (req, res) => {
    const { id } = req.params;
    const { product_name, category_id, price, stock } = req.body;
    try {
        if (req.file) {
            const image_url = `http://localhost:${PORT}/uploads/${req.file.filename}`;
            await db.query(
                `UPDATE products SET product_name=?, category_id=?, price=?, stock=?, image_url=? WHERE product_id=?`,
                [product_name, category_id, price, stock, image_url, id]
            );
        } else {
            await db.query(
                `UPDATE products SET product_name=?, category_id=?, price=?, stock=? WHERE product_id=?`,
                [product_name, category_id, price, stock, id]
            );
        }
        res.json({ message: 'Cập nhật thành công' });
    } catch (e) { 
        res.status(500).json({ error: e.message }); 
    }
});

app.delete('/api/products/:id', async (req, res) => {
    try {
        await db.query('DELETE FROM products WHERE product_id=?', [req.params.id]);
        res.json({ message: 'Đã xoá sản phẩm' });
    } catch (e) { res.status(500).json({ error: e.message }); }
});


// ==========================================
// API 4: QUẢN LÝ ĐƠN HÀNG (Giữ nguyên)
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
    const { customer_id, order_date, items } = req.body; 
    // items là mảng: [{ product_id: 1, quantity: 2 }, { product_id: 5, quantity: 1 }]

    if (!items || items.length === 0) {
        return res.status(400).json({ error: "Đơn hàng phải có ít nhất một sản phẩm!" });
    }

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        // 1. Tạo đơn hàng tổng trước (total_amount tạm thời là 0)
        const [orderResult] = await connection.query(
            "INSERT INTO orders (customer_id, order_date, total_amount) VALUES (?, ?, 0)",
            [customer_id, order_date]
        );
        const newOrderId = orderResult.insertId;

        let grandTotal = 0;

        // 2. Lặp qua danh sách sản phẩm khách mua
        for (const item of items) {
            const { product_id, quantity } = item;

            // Kiểm tra tồn kho và lấy giá sản phẩm
            const [prodRows] = await connection.query(
                "SELECT stock, price, product_name FROM products WHERE product_id = ?", 
                [product_id]
            );

            if (prodRows.length === 0) throw new Error(`Sản phẩm ID ${product_id} không tồn tại`);
            
            const product = prodRows[0];

            if (quantity > product.stock) {
                throw new Error(`Sản phẩm "${product.product_name}" chỉ còn ${product.stock} trong kho!`);
            }

            const itemTotal = product.price * quantity;
            grandTotal += itemTotal;

            // 3. Chèn vào bảng order_items
            await connection.query(
                "INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)",
                [newOrderId, product_id, quantity, product.price]
            );

            // 4. Trừ tồn kho
            await connection.query(
                "UPDATE products SET stock = stock - ? WHERE product_id = ?",
                [quantity, product_id]
            );
        }

        // 5. Cập nhật lại tổng tiền cuối cùng vào bảng orders
        await connection.query(
            "UPDATE orders SET total_amount = ? WHERE order_id = ?",
            [grandTotal, newOrderId]
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

app.delete('/api/orders/:id', async (req, res) => {
    const { id } = req.params;
    const connection = await db.getConnection();
    
    try {
        // Bắt đầu giao dịch (Transaction) để đảm bảo an toàn dữ liệu
        await connection.beginTransaction();

        // 1. Lấy danh sách sản phẩm trong đơn để biết số lượng cần hoàn lại kho
        const [items] = await connection.query(
            "SELECT product_id, quantity FROM order_items WHERE order_id = ?", 
            [id]
        );

        // 2. Hoàn trả số lượng sản phẩm về lại bảng products (Cộng lại tồn kho)
        for (const item of items) {
            await connection.query(
                "UPDATE products SET stock = stock + ? WHERE product_id = ?",
                [item.quantity, item.product_id]
            );
        }

        // 3. Xóa các chi tiết đơn hàng trước (trong bảng order_items)
        await connection.query("DELETE FROM order_items WHERE order_id = ?", [id]);

        // 4. Cuối cùng mới xóa đơn hàng chính (trong bảng orders)
        await connection.query("DELETE FROM orders WHERE order_id = ?", [id]);

        // Xác nhận hoàn tất mọi thay đổi
        await connection.commit();
        
        res.json({ success: true, message: "Đã xóa đơn hàng và hoàn lại kho thành công!" });

    } catch (error) {
        // Nếu có lỗi ở bất kỳ bước nào, quay ngược lại trạng thái cũ (Rollback)
        await connection.rollback();
        console.error("Lỗi xóa đơn hàng:", error);
        res.status(500).json({ error: "Lỗi hệ thống khi xóa đơn hàng" });
    } finally {
        // Trả lại kết nối cho hồ chứa (pool)
        connection.release();
    }
});
// ==========================================
// API 5: DASHBOARD & KHÁC
// ==========================================

// Đây là API tự đổi mật khẩu của bản thân (Ai đổi cũng được nếu biết pass cũ -> Không cần checkAdmin)
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
app.get('/api/orders/:id/items', async (req, res) => {
    const { id } = req.params;
    try {
        const query = `
            SELECT 
                oi.order_item_id, 
                p.product_name, 
                oi.quantity, 
                oi.price
            FROM order_items oi
            JOIN products p ON oi.product_id = p.product_id
            WHERE oi.order_id = ?
        `;
        const [rows] = await db.query(query, [id]);
        res.json(rows);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});
// START SERVER
app.listen(PORT, () =>
    console.log(`🚀 Backend đang chạy tại: http://localhost:${PORT}`)
);