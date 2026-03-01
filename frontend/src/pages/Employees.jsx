import React, { useState, useEffect } from "react";
import { Table, Button, Modal, Form, Input, InputNumber, message, Popconfirm, Card, Statistic, Row, Col } from "antd";
import axios from "axios";
import { UserAddOutlined, DollarCircleOutlined } from "@ant-design/icons";

const Employees = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null); // Để biết đang sửa hay thêm mới
    const [form] = Form.useForm();

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await axios.get("http://localhost:5000/api/users");
            setUsers(res.data);
        } catch (error) {
            message.error("Lỗi tải danh sách nhân viên");
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    // Tính tổng quỹ lương
    const totalSalary = users.reduce((sum, u) => sum + Number(u.salary), 0);

    const handleSave = async () => {
        try {
            const values = await form.validateFields();
            if (editingUser) {
                // Cập nhật
                await axios.put(`http://localhost:5000/api/users/${editingUser.user_id}`, values);
                message.success("Cập nhật thành công!");
            } else {
                // Thêm mới
                await axios.post("http://localhost:5000/api/users", values);
                message.success("Thêm nhân viên mới thành công!");
            }
            setOpen(false);
            fetchUsers();
        } catch (error) {
            message.error("Có lỗi xảy ra");
        }
    };

    const handleDelete = async (id) => {
        try {
            await axios.delete(`http://localhost:5000/api/users/${id}`);
            message.success("Đã xóa nhân viên");
            fetchUsers();
        } catch (error) {
            message.error("Lỗi khi xóa");
        }
    };

    const openModal = (user = null) => {
        setEditingUser(user);
        if (user) {
            form.setFieldsValue(user); // Điền dữ liệu cũ vào form nếu là sửa
        } else {
            form.resetFields(); // Xóa trắng form nếu là thêm mới
        }
        setOpen(true);
    };

    const columns = [
        { title: "ID", dataIndex: "user_id", width: 60 },
        { title: "Họ và tên", dataIndex: "full_name", render: (t) => <strong>{t}</strong> },
        { title: "Tài khoản (Username)", dataIndex: "username" },
        { 
            title: "Lương cơ bản", 
            dataIndex: "salary", 
            render: (v) => <span style={{ color: 'green' }}>{Number(v).toLocaleString()} ₫</span> 
        },
        {
            title: "Hành động",
            render: (_, r) => (
                <>
                    <Button type="link" onClick={() => openModal(r)}>Sửa lương</Button>
                    <Popconfirm title="Sa thải nhân viên này?" onConfirm={() => handleDelete(r.user_id)}>
                        <Button type="link" danger>Xóa</Button>
                    </Popconfirm>
                </>
            ),
        },
    ];

    return (
        <div>
            <Row gutter={16} style={{ marginBottom: 20 }}>
                <Col span={8}>
                    <Card>
                        <Statistic 
                            title="Tổng quỹ lương tháng" 
                            value={totalSalary} 
                            precision={0} 
                            suffix="₫" 
                            prefix={<DollarCircleOutlined />} 
                            valueStyle={{ color: '#cf1322' }}
                        />
                    </Card>
                </Col>
            </Row>

            <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
                <h3>Danh sách nhân viên</h3>
                <Button type="primary" icon={<UserAddOutlined />} onClick={() => openModal(null)}>
                    + Tuyển nhân viên mới
                </Button>
            </div>

            <Table rowKey="user_id" columns={columns} dataSource={users} loading={loading} />

            <Modal
                title={editingUser ? "Cập nhật nhân viên" : "Tuyển nhân viên mới"}
                open={open}
                onOk={handleSave}
                onCancel={() => setOpen(false)}
            >
                <Form form={form} layout="vertical">
                    <Form.Item name="full_name" label="Họ và tên" rules={[{ required: true }]}>
                        <Input placeholder="Ví dụ: Nguyễn Văn A" />
                    </Form.Item>
                    
                    {/* Chỉ cho nhập username/password khi thêm mới, sửa thì khóa lại */}
                    {!editingUser && (
                        <>
                            <Form.Item name="username" label="Tên đăng nhập" rules={[{ required: true }]}>
                                <Input placeholder="user1" />
                            </Form.Item>
                            <Form.Item name="password" label="Mật khẩu khởi tạo" rules={[{ required: true }]}>
                                <Input.Password placeholder="123456" />
                            </Form.Item>
                        </>
                    )}

                    <Form.Item name="salary" label="Lương cơ bản (VNĐ)" rules={[{ required: true }]}>
                        <InputNumber style={{ width: '100%' }} formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} parser={value => value.replace(/\$\s?|(,*)/g, '')} />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default Employees;