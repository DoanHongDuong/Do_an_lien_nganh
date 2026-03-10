import React from 'react';
import { Form, Input, Button, Card, Typography, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import axios from 'axios';

const { Title } = Typography;

const Login = ({ onLogin }) => {
    const [loading, setLoading] = React.useState(false);

    const handleSubmit = async (values) => {
        setLoading(true);
        try {
            // Gọi API kiểm tra tài khoản
            const res = await axios.post('http://localhost:5000/api/login', values);
            
            if (res.data.success) {
                message.success('Đăng nhập thành công!');
                // Lưu thông tin user vào bộ nhớ trình duyệt để lần sau không phải nhập lại
                localStorage.setItem('user', JSON.stringify(res.data.user));
                // Báo cho App.jsx biết là đã đăng nhập
                onLogin(res.data.user);
            }
        } catch (error) {
            message.error(error.response?.data?.message || 'Lỗi kết nối Server');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            height: '100vh', 
            background: '#f0f2f5',
            backgroundImage: 'url(https://gw.alipayobjects.com/zos/rmsportal/TVYTbAXWheQpRcWDaDMu.svg)' // Hình nền nhẹ
        }}>
            <Card style={{ width: 400, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
                <div style={{ textAlign: 'center', marginBottom: 24 }}>
                    <Title level={3}>Quản Lý Cửa Hàng</Title>
                    <p>Đăng nhập để vào hệ thống</p>
                </div>

                <Form
                    name="login_form"
                    onFinish={handleSubmit}
                    size="large"
                >
                    <Form.Item
                        name="username"
                        rules={[{ required: true, message: 'Vui lòng nhập tên đăng nhập!' }]}
                    >
                        <Input prefix={<UserOutlined />} placeholder="Tên đăng nhập" />
                    </Form.Item>

                    <Form.Item
                        name="password"
                        rules={[{ required: true, message: 'Vui lòng nhập mật khẩu!' }]}
                    >
                        <Input.Password prefix={<LockOutlined />} placeholder="Mật khẩu" />
                    </Form.Item>

                    <Form.Item>
                        <Button type="primary" htmlType="submit" block loading={loading}>
                            Đăng nhập
                        </Button>
                    </Form.Item>
                </Form>
            </Card>
        </div>
    );
};

export default Login;