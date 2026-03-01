import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic, Table, Avatar, Tag } from 'antd'; // Thêm Table, Avatar, Tag
import { DollarCircleOutlined, ShoppingCartOutlined, UserOutlined, RiseOutlined, FireOutlined } from '@ant-design/icons';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import axios from 'axios';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const Home = () => {
  const [stats, setStats] = useState({ revenue: 0, orders: 0, customers: 0 });
  const [chartData, setChartData] = useState({ labels: [], datasets: [] });
  const [topProducts, setTopProducts] = useState([]); // State lưu top sản phẩm

  useEffect(() => {
    fetchStats();
    fetchChartData();
    fetchTopProducts(); // Gọi hàm lấy top sản phẩm
  }, []);

  const fetchStats = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/dashboard/stats');
      setStats(res.data);
    } catch (error) { console.error("Lỗi stats:", error); }
  };

  const fetchChartData = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/revenue');
      const data = res.data;
      setChartData({
        labels: data.map(item => new Date(item.date).toLocaleDateString('vi-VN')),
        datasets: [
          {
            label: 'Doanh thu (VNĐ)',
            data: data.map(item => item.revenue),
            borderColor: 'rgb(53, 162, 235)',
            backgroundColor: 'rgba(53, 162, 235, 0.5)',
            tension: 0.3,
          },
        ],
      });
    } catch (error) { console.error("Lỗi chart:", error); }
  };

  // Hàm lấy Top sản phẩm
  const fetchTopProducts = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/dashboard/top-products');
      setTopProducts(res.data);
    } catch (error) { console.error("Lỗi top products:", error); }
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'top' },
      title: { display: false },
    },
  };

  // Cấu hình cột cho bảng Top Sản Phẩm
  const columns = [
    {
      title: 'Sản phẩm',
      dataIndex: 'product_name',
      key: 'product_name',
      render: (text, record) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Avatar src={record.image_url} shape="square" size="large" />
          <span style={{ fontWeight: 500 }}>{text}</span>
        </div>
      ),
    },
    {
      title: 'Đã bán',
      dataIndex: 'total_sold',
      key: 'total_sold',
      align: 'center',
      render: (sold) => <Tag color="volcano">{sold}</Tag>,
    },
    {
      title: 'Doanh thu',
      dataIndex: 'total_revenue',
      key: 'total_revenue',
      align: 'right',
      render: (value) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value),
    },
  ];

  return (
    <div style={{ padding: '0 10px' }}>
      <h2 style={{ marginBottom: '20px' }}>📊 Tổng Quan Kinh Doanh</h2>
      
      {/* 1. Khu vực Thẻ Thống Kê (Giữ nguyên) */}
      <Row gutter={16} style={{ marginBottom: '24px' }}>
        <Col span={8}>
          <Card bordered={false} style={{ background: '#e6f7ff', borderRadius: 10 }}>
            <Statistic title="Doanh Thu Tổng" value={stats.revenue} precision={0} valueStyle={{ color: '#096dd9', fontWeight: 'bold' }} prefix={<DollarCircleOutlined />} suffix="₫" />
          </Card>
        </Col>
        <Col span={8}>
          <Card bordered={false} style={{ background: '#f6ffed', borderRadius: 10 }}>
            <Statistic title="Tổng Đơn Hàng" value={stats.orders} valueStyle={{ color: '#3f8600', fontWeight: 'bold' }} prefix={<ShoppingCartOutlined />} />
          </Card>
        </Col>
        <Col span={8}>
          <Card bordered={false} style={{ background: '#fff7e6', borderRadius: 10 }}>
            <Statistic title="Khách Hàng" value={stats.customers} valueStyle={{ color: '#d46b08', fontWeight: 'bold' }} prefix={<UserOutlined />} />
          </Card>
        </Col>
      </Row>

      {/* 2. Khu vực Biểu đồ & Top Sản phẩm */}
      <Row gutter={16}>
        {/* Cột Trái: Biểu đồ (Chiếm 14/24 phần) */}
        <Col span={14}>
          <Card title={<><RiseOutlined /> Xu hướng doanh thu</>} bordered={true} style={{ borderRadius: 10, height: '100%' }}>
             {chartData.labels.length > 0 ? <Line options={chartOptions} data={chartData} /> : <p>Đang tải...</p>}
          </Card>
        </Col>

        {/* Cột Phải: Top Sản phẩm (Chiếm 10/24 phần) */}
        <Col span={10}>
          <Card title={<><FireOutlined style={{ color: 'red' }} /> Top 5 Sản phẩm bán chạy</>} bordered={true} style={{ borderRadius: 10, height: '100%' }}>
            <Table 
                dataSource={topProducts} 
                columns={columns} 
                rowKey="product_name" 
                pagination={false} 
                size="small"
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Home;