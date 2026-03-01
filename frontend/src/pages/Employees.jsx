import React, { useState, useEffect } from "react";
import { Table, Button, Modal, Form, Input, InputNumber, message, Popconfirm, Card, Statistic, Row, Col, Space } from "antd";
import axios from "axios";
import { UserAddOutlined, DollarCircleOutlined, KeyOutlined } from "@ant-design/icons";

const Employees = () => {
    // --- 1. STATE QUẢN LÝ DỮ LIỆU ---
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);

    // State cho Modal Thêm/Sửa nhân viên
    const [open, setOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [form] = Form.useForm();

    // State cho Modal Đổi Mật Khẩu (Mới thêm)
    const [passwordModalOpen, setPasswordModalOpen] = useState(false);
    const [passwordUser, setPasswordUser] = useState(null); // Lưu user đang được đổi pass
    const [newPassword, setNewPassword] = useState("");

    // --- 2. HÀM TIỆN ÍCH LẤY HEADER (QUAN TRỌNG) ---
    // Hàm này giúp lấy role hiện tại để gửi xuống backend
    const getAuthHeaders = () => {
        const currentUser = JSON.parse(localStorage.getItem('user'));
        return {
            'Content-Type': 'application/json',
            'x-user-role': currentUser?.role || ''
        };
    };

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

    const totalSalary = users.reduce((sum, u) => sum + Number(u.salary), 0);

    // --- 3. XỬ LÝ THÊM / SỬA NHÂN VIÊN ---
    const handleSave = async () => {
        try {
            const values = await form.validateFields();
            if (editingUser) {
                // Cập nhật (Kèm Header xác thực)
                await axios.put(
                    `http://localhost:5000/api/users/${editingUser.user_id}`, 
                    values,
                    { headers: getAuthHeaders() } // <--- BẮT BUỘC PHẢI CÓ
                );
                message.success("Cập nhật thành công!");
            } else {
                // Thêm mới (Kèm Header xác thực)
                await axios.post(
                    "http://localhost:5000/api/users", 
                    values,
                    { headers: getAuthHeaders() } // <--- BẮT BUỘC PHẢI CÓ
                );
                message.success("Thêm nhân viên mới thành công!");
            }
            setOpen(false);
            fetchUsers();
        } catch (error) {
            // Check lỗi từ backend trả về
            if (error.response && error.response.status === 403) {
                message.error("Bạn không có quyền thực hiện (Cần Admin)");
            } else {
                message.error("Có lỗi xảy ra");
            }
        }
    };

    // --- 4. XỬ LÝ XÓA NHÂN VIÊN ---
    const handleDelete = async (id) => {
        try {
            await axios.delete(`http://localhost:5000/api/users/${id}`, {
                headers: getAuthHeaders() // <--- BẮT BUỘC PHẢI CÓ
            });
            message.success("Đã xóa nhân viên");
            fetchUsers();
        } catch (error) {
            if (error.response && error.response.status === 403) {
                message.error("Bạn không được phép xóa nhân viên!");
            } else {
                message.error("Lỗi khi xóa");
            }
        }
    };

    // --- 5. XỬ LÝ ĐỔI MẬT KHẨU (LOGIC MỚI) ---
    const openPasswordModal = (user) => {
        setPasswordUser(user);
        setNewPassword("");
        setPasswordModalOpen(true);
    };

    const handleChangePassword = async () => {
        if (!newPassword) return message.warning("Vui lòng nhập mật khẩu mới");

        try {
            // Gọi API đổi mật khẩu (Kèm Header)
            await axios.put(
                `http://localhost:5000/api/users/${passwordUser.user_id}/change-password`,
                { new_password: newPassword },
                { headers: getAuthHeaders() } // <--- QUAN TRỌNG
            );
            
            message.success(`Đã đổi pass cho ${passwordUser.username}`);
            setPasswordModalOpen(false);
        } catch (error) {
            if (error.response && error.response.status === 403) {
                message.error("Bạn không có quyền đổi mật khẩu!");
            } else {
                message.error("Lỗi kết nối server");
            }
        }
    };

    const openModal = (user = null) => {
        setEditingUser(user);
        if (user) {
            form.setFieldsValue(user);
        } else {
            form.resetFields();
        }
        setOpen(true);
    };

    const columns = [
        { title: "ID", dataIndex: "user_id", width: 60 },
        { title: "Họ và tên", dataIndex: "full_name", render: (t) => <strong>{t}</strong> },
        { title: "Tài khoản", dataIndex: "username" },
        { 
            title: "Lương cơ bản", 
            dataIndex: "salary", 
            render: (v) => <span style={{ color: 'green' }}>{Number(v).toLocaleString()} ₫</span> 
        },
        {
            title: "Hành động",
            render: (_, r) => (
                <Space>
                    <Button type="link" onClick={() => openModal(r)}>Sửa</Button>
                    
                    {/* NÚT ĐỔI MẬT KHẨU MỚI THÊM */}
                    <Button 
                        type="dashed" 
                        size="small" 
                        icon={<KeyOutlined />} 
                        onClick={() => openPasswordModal(r)}
                    >
                        Đổi MK
                    </Button>

                    <Popconfirm title="Sa thải nhân viên này?" onConfirm={() => handleDelete(r.user_id)}>
                        <Button type="link" danger>Xóa</Button>
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <div>
            {/* THỐNG KÊ */}
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

            {/* THANH CÔNG CỤ */}
            <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
                <h3>Danh sách nhân viên</h3>
                <Button type="primary" icon={<UserAddOutlined />} onClick={() => openModal(null)}>
                    + Tuyển nhân viên mới
                </Button>
            </div>

            {/* BẢNG DỮ LIỆU */}
            <Table rowKey="user_id" columns={columns} dataSource={users} loading={loading} />

            {/* MODAL 1: THÊM / SỬA NHÂN VIÊN */}
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

            {/* MODAL 2: ĐỔI MẬT KHẨU (MỚI) */}
            <Modal
                title={`Đổi mật khẩu cho: ${passwordUser?.full_name}`}
                open={passwordModalOpen}
                onOk={handleChangePassword}
                onCancel={() => setPasswordModalOpen(false)}
                okText="Lưu mật khẩu mới"
                cancelText="Hủy"
            >
                <p>Nhập mật khẩu mới cho nhân viên <strong>{passwordUser?.username}</strong>:</p>
                <Input.Password 
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Nhập mật khẩu mới..."
                    prefix={<KeyOutlined />}
                />
            </Modal>
        </div>
    );
};

export default Employees;