// frontend/src/App.jsx
import React, { useState } from 'react';
import { Layout, Menu, theme, Typography } from 'antd';
import {
  DesktopOutlined,
  PieChartOutlined,
  UserOutlined,
  ShopOutlined,
} from '@ant-design/icons';
import RevenueChart from './RevenueChart'; // Import biểu đồ vừa tạo

const { Header, Content, Footer, Sider } = Layout;
const { Title } = Typography;

function App() {
  const [collapsed, setCollapsed] = useState(false);
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  // Danh sách menu
  const items = [
    { key: '1', icon: <PieChartOutlined />, label: 'Dashboard' },
    { key: '2', icon: <ShopOutlined />, label: 'Quản lý Sản phẩm' },
    { key: '3', icon: <DesktopOutlined />, label: 'Quản lý Đơn hàng' },
    { key: '4', icon: <UserOutlined />, label: 'Khách hàng' },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider collapsible collapsed={collapsed} onCollapse={(value) => setCollapsed(value)}>
        <div style={{ height: 32, margin: 16, background: 'rgba(255, 255, 255, 0.2)', textAlign: 'center', color: 'white', lineHeight: '32px', fontWeight: 'bold' }}>
          ADMIN
        </div>
        <Menu theme="dark" defaultSelectedKeys={['1']} mode="inline" items={items} />
      </Sider>
      <Layout>
        <Header style={{ padding: '0 16px', background: colorBgContainer }}>
          <Title level={4} style={{ margin: '14px 0' }}>Hệ thống quản lý cửa hàng</Title>
        </Header>
        <Content style={{ margin: '16px 16px' }}>
          <div
            style={{
              padding: 24,
              minHeight: 360,
              background: colorBgContainer,
              borderRadius: borderRadiusLG,
            }}
          >
            {/* Đây là nơi nội dung thay đổi. Tạm thời mình để Biểu đồ ở đây */}
            <h3>Tổng quan kinh doanh</h3>
            <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                <RevenueChart />
            </div>
            
          </div>
        </Content>
        <Footer style={{ textAlign: 'center' }}>
          Do An Lien Nganh ©2026 Created by You
        </Footer>
      </Layout>
    </Layout>
  );
}

export default App;