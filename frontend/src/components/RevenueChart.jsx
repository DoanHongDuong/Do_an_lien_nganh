import { useEffect, useState } from "react";
import axios from "axios";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card } from "antd";

const RevenueChart = () => {
  const [data, setData] = useState([]);

  useEffect(() => {
    axios
      .get("http://localhost:5000/api/reports/revenue")
      .then((res) => {
        const mapped = res.data.map((item) => ({
          date: item.order_date,
          revenue: Number(item.revenue),
        }));
        setData(mapped);
      })
      .catch((err) => {
        console.error("Lỗi lấy doanh thu:", err);
      });
  }, []);

  return (
    <Card title="Doanh thu theo ngày" bordered={false}>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis
            tickFormatter={(v) => v.toLocaleString("vi-VN") + " ₫"}
          />
          <Tooltip
            formatter={(v) => v.toLocaleString("vi-VN") + " ₫"}
          />
          <Line
            type="monotone"
            dataKey="revenue"
            stroke="#1677ff"
            strokeWidth={3}
            dot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
};

export default RevenueChart;