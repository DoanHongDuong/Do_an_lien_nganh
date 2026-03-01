DROP DATABASE IF EXISTS do_an_lien_nganh;
CREATE DATABASE do_an_lien_nganh
CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE do_an_lien_nganh;

-- ==========================================
-- 2. TẠO BẢNG
-- ==========================================

CREATE TABLE users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL, 
    full_name VARCHAR(100) DEFAULT 'Nhân viên',
    role ENUM('admin', 'staff') DEFAULT 'staff',
    salary DECIMAL(10,2) DEFAULT 5000000,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE categories (
    category_id INT AUTO_INCREMENT PRIMARY KEY,
    category_name VARCHAR(100) NOT NULL
);

CREATE TABLE products (
    product_id INT AUTO_INCREMENT PRIMARY KEY,
    product_name VARCHAR(150) NOT NULL,
    category_id INT NOT NULL,
    price DECIMAL(12,2) NOT NULL,
    stock INT DEFAULT 0,
    image_url VARCHAR(500) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(category_id)
);

CREATE TABLE customers (
    customer_id INT AUTO_INCREMENT PRIMARY KEY,
    customer_name VARCHAR(100),
    phone VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE orders (
    order_id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT NOT NULL,
    order_date DATE NOT NULL,
    total_amount DECIMAL(12,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(customer_id)
);

CREATE TABLE order_items (
    order_item_id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL,
    price DECIMAL(12,2) NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(product_id)
);

-- ==========================================
-- 3. TẠO TRIGGER (Tự động tính tiền đơn hàng)
-- ==========================================
DELIMITER $$

CREATE TRIGGER trg_ai_order_items AFTER INSERT ON order_items
FOR EACH ROW
BEGIN
    UPDATE orders SET total_amount = (SELECT IFNULL(SUM(quantity * price), 0) FROM order_items WHERE order_id = NEW.order_id) WHERE order_id = NEW.order_id;
END$$

CREATE TRIGGER trg_au_order_items AFTER UPDATE ON order_items
FOR EACH ROW
BEGIN
    UPDATE orders SET total_amount = (SELECT IFNULL(SUM(quantity * price), 0) FROM order_items WHERE order_id = NEW.order_id) WHERE order_id = NEW.order_id;
END$$

CREATE TRIGGER trg_ad_order_items AFTER DELETE ON order_items
FOR EACH ROW
BEGIN
    UPDATE orders SET total_amount = (SELECT IFNULL(SUM(quantity * price), 0) FROM order_items WHERE order_id = OLD.order_id) WHERE order_id = OLD.order_id;
END$$

DELIMITER ;

-- ==========================================
-- 4. DỮ LIỆU MẪU (MẬT KHẨU DẠNG THUẦN - DỄ SỬ DỤNG)
-- ==========================================

-- Thêm Admin
INSERT INTO users (username, password, full_name, role, salary) 
VALUES ('admin', '123456', 'Quản Trị Viên', 'admin', 20000000);

-- Thêm Nhân viên
INSERT INTO users (username, password, full_name, role, salary) 
VALUES ('nhanvien', '123456', 'Nguyễn Văn Bán Hàng', 'staff', 6000000);

INSERT INTO categories (category_name) VALUES 
('Vợt Cầu Lông'), 
('Giày Thể Thao'), 
('Quần Áo'), 
('Phụ Kiện');

INSERT INTO products (product_name, category_id, price, stock) VALUES
('Yonex Astrox 99', 1, 4500000, 10), 
('Lining Turbo X', 1, 2800000, 15), 
('Giày Victor A970', 2, 1900000, 8);

INSERT INTO customers (customer_name, phone) VALUES 
('Nguyễn Văn A', '0901234567'), 
('Trần Thị B', '0912345678');

INSERT INTO orders (customer_id, order_date, total_amount) VALUES 
(1, '2026-01-10', 0), 
(2, '2026-01-11', 0);

INSERT INTO order_items (order_id, product_id, quantity, price) VALUES 
(1, 1, 1, 4500000), 
(2, 2, 1, 2800000);
INSERT INTO orders (customer_id, order_date, total_amount) VALUES (1, DATE_SUB(CURDATE(), INTERVAL 1 DAY), 2500000);
-- Thêm đơn hàng cho 2 ngày trước
INSERT INTO orders (customer_id, order_date, total_amount) VALUES (2, DATE_SUB(CURDATE(), INTERVAL 2 DAY), 1800000);
-- Thêm đơn hàng cho 3 ngày trước
INSERT INTO orders (customer_id, order_date, total_amount) VALUES (1, DATE_SUB(CURDATE(), INTERVAL 3 DAY), 4200000);
-- Thêm đơn hàng cho 4 ngày trước
INSERT INTO orders (customer_id, order_date, total_amount) VALUES (2, DATE_SUB(CURDATE(), INTERVAL 4 DAY), 950000);
