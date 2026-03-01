import React, { useState, useEffect } from "react";
import { Layout, Menu, theme, Typography, Dropdown, Space, Avatar } from "antd";
import {
  DesktopOutlined,
  PieChartOutlined,
  UserOutlined,
  ShopOutlined,
  LogoutOutlined,
  DownOutlined,
  TeamOutlined 
} from "@ant-design/icons";
import { Routes, Route, useNavigate, useLocation, Navigate } from "react-router-dom";

// Import đầy đủ các trang
import Home from './pages/Home';
import Products from "./pages/Products";
import Customers from "./pages/Customers";
import Orders from "./pages/Orders";
import Login from "./pages/Login";
// import Employees from "./pages/Employees"; // Bỏ comment dòng này nếu bạn đã tạo file Employees.jsx

const { Header, Content, Footer, Sider } = Layout;
const { Title } = Typography;

export default function App() {
  const [collapsed, setCollapsed] = useState(false);
  
  // Lấy thông tin user từ bộ nhớ trình duyệt
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  
  const navigate = useNavigate();
  const location = useLocation();

  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  // Hàm xử lý đăng xuất
  const handleLogout = () => {
      localStorage.removeItem('user');
      setUser(null);
      navigate('/');
  };

  // Menu dropdown cho Avatar
  const userMenu = {
      items: [
          {
              key: '1',
              label: 'Đăng xuất',
              icon: <LogoutOutlined />,
              onClick: handleLogout
          }
      ]
  };

  // --- LOGIC QUAN TRỌNG: CHECK ĐĂNG NHẬP ---
  if (!user) {
      return <Login onLogin={(userData) => setUser(userData)} />;
  }

  // --- CẤU HÌNH MENU THEO QUYỀN (ROLE) ---
  const items = [
    // 1. Dashboard: Chỉ Admin mới thấy
    ...(user.role === 'admin' ? [{ 
      key: "/", 
      icon: <PieChartOutlined />, 
      label: "Dashboard Doanh thu" 
    }] : []),

    // 2. Các mục chung: Ai cũng thấy
    { key: "/products", icon: <ShopOutlined />, label: "Sản phẩm" },
    { key: "/orders", icon: <DesktopOutlined />, label: "Bán hàng (Đơn hàng)" },
    { key: "/customers", icon: <UserOutlined />, label: "Khách hàng" },

    // 3. Quản lý nhân viên: Chỉ Admin mới thấy
    ...(user.role === 'admin' ? [{ 
      key: "/employees", 
      icon: <TeamOutlined />, 
      label: "Quản lý Nhân sự" 
    }] : []),
  ];

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sider collapsible collapsed={collapsed} onCollapse={setCollapsed}>
        <div style={{ height: 32, margin: 16, background: "rgba(255, 255, 255, 0.2)", textAlign: "center", color: "white", lineHeight: "32px", fontWeight: "bold" }}>
          {user.role === 'admin' ? 'BOSS ADMIN' : 'SHOP STAFF'}
        </div>
        <Menu 
            theme="dark" 
            mode="inline" 
            items={items} 
            selectedKeys={[location.pathname]} 
            onClick={({ key }) => navigate(key)} 
        />
      </Sider>

      <Layout>
        <Header style={{ padding: "0 24px", background: colorBgContainer, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Title level={4} style={{ margin: 0 }}>Hệ thống quản lý</Title>
          
          <Dropdown menu={userMenu} trigger={['click']}>
              <Space style={{ cursor: 'pointer' }}>
                  <Avatar icon={<UserOutlined />} style={{ backgroundColor: user.role === 'admin' ? '#f56a00' : '#87d068' }} />
                  <strong>{user.full_name || user.username}</strong>
                  <DownOutlined />
              </Space>
          </Dropdown>
        </Header>

        <Content style={{ margin: "16px" }}>
          <div style={{ padding: 24, minHeight: 360, background: colorBgContainer, borderRadius: borderRadiusLG }}>
            <Routes>
              {/* --- PHÂN QUYỀN ROUTE --- */}
              
              {/* Admin vào Home sẽ thấy Dashboard */}
              {user.role === 'admin' && <Route path="/" element={<Home />} />}
              
              <Route path="/products" element={<Products />} />
              <Route path="/customers" element={<Customers />} />
              <Route path="/orders" element={<Orders />} />
              
              {/* Chỉ Admin mới vào được trang nhân viên */}
              {/* {user.role === 'admin' && <Route path="/employees" element={<Employees />} />} */}
              
              {/* Route mặc định: Nếu link sai hoặc Staff vào trang chủ -> Đẩy về trang Sản phẩm */}
              <Route path="*" element={<Navigate to="/products" />} />
            </Routes>
          </div>
        </Content>

        <Footer style={{ textAlign: "center" }}>Đồ án Liên Ngành ©2026</Footer>
      </Layout>
    </Layout>
  );
}