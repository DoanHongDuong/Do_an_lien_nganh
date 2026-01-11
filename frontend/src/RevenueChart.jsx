// frontend/src/RevenueChart.jsx
import React, { useEffect, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import { Card, Spin, Alert } from 'antd';
import axios from 'axios';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

// Đăng ký các thành phần biểu đồ
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const RevenueChart = () => {
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Gọi API lấy doanh thu
    const fetchRevenue = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/reports/revenue');
        const data = res.data;

        // Chuẩn bị dữ liệu cho Chart.js
        setChartData({
          labels: data.map(item => new Date(item.order_date).toLocaleDateString('vi-VN')), // Trục hoành: Ngày
          datasets: [
            {
              label: 'Doanh thu (VNĐ)',
              data: data.map(item => item.revenue), // Trục tung: Tiền
              backgroundColor: 'rgba(24, 144, 255, 0.6)',
              borderColor: 'rgba(24, 144, 255, 1)',
              borderWidth: 1,
            },
          ],
        });
      } catch (error) {
        console.error('Lỗi tải dữ liệu:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRevenue();
  }, []);

  return (
    <Card title="Biểu đồ phân tích doanh thu" style={{ marginTop: 20, boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }}>
      {loading ? <Spin tip="Đang tải..." /> : (
        chartData ? <Bar data={chartData} options={{ responsive: true }} /> : <Alert message="Không có dữ liệu" type="warning" />
      )}
    </Card>
  );
};

export default RevenueChart;