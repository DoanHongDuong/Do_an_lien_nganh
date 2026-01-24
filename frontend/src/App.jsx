import React, { useState } from "react";
import { Layout, Menu, theme, Typography } from "antd";
import {
  DesktopOutlined,
  PieChartOutlined,
  UserOutlined,
  ShopOutlined,
} from "@ant-design/icons";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";

import Home from "./pages/Home";
import Products from "./pages/Products";

const { Header, Content, Footer, Sider } = Layout;
const { Title } = Typography;

export default function App() {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  const items = [
    {
      key: "/",
      icon: <PieChartOutlined />,
      label: "Dashboard",
    },
    {
      key: "/products",
      icon: <ShopOutlined />,
      label: "Quản lý Sản phẩm",
    },
    {
      key: "/orders",
      icon: <DesktopOutlined />,
      label: "Quản lý Đơn hàng",
    },
    {
      key: "/customers",
      icon: <UserOutlined />,
      label: "Khách hàng",
    },
  ];

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sider collapsible collapsed={collapsed} onCollapse={setCollapsed}>
        <div
          style={{
            height: 32,
            margin: 16,
            background: "rgba(255, 255, 255, 0.2)",
            textAlign: "center",
            color: "white",
            lineHeight: "32px",
            fontWeight: "bold",
          }}
        >
          ADMIN
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
        <Header style={{ padding: "0 16px", background: colorBgContainer }}>
          <Title level={4} style={{ margin: "14px 0" }}>
            Hệ thống quản lý cửa hàng
          </Title>
        </Header>

        <Content style={{ margin: "16px" }}>
          <div
            style={{
              padding: 24,
              minHeight: 360,
              background: colorBgContainer,
              borderRadius: borderRadiusLG,
            }}
          >
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/products" element={<Products />} />
            </Routes>
          </div>
        </Content>

        <Footer style={{ textAlign: "center" }}>
          Đồ án Liên Ngành ©2026
        </Footer>
      </Layout>
    </Layout>
  );
}