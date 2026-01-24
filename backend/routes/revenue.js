const express = require("express");
const router = express.Router();
const db = require("../db"); // pool.promise()

// Doanh thu theo ngày
router.get("/", async (req, res) => {
    try {
        const [rows] = await db.query(`
      SELECT 
        order_date AS date,
        SUM(total_amount) AS revenue
      FROM orders
      GROUP BY order_date
      ORDER BY order_date
    `);

        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Lỗi server" });
    }
});

module.exports = router;