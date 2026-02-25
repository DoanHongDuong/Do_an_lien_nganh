import {
    Table,
    Typography,
    Button,
    Modal,
    Form,
    Input,
    Space,
    Popconfirm,
    message,
} from "antd";
import { useEffect, useState } from "react";
import axios from "axios";

const { Title } = Typography;
const API_CUSTOMERS = "http://localhost:5000/api/customers";

const Customers = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form] = Form.useForm();

    // Gọi API lấy danh sách khách hàng
    const fetchCustomers = async () => {
        setLoading(true);
        try {
            const res = await axios.get(API_CUSTOMERS);
            setData(res.data);
        } catch {
            message.error("Lỗi tải danh sách khách hàng");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCustomers();
    }, []);

    const openAdd = () => {
        setEditing(null);
        form.resetFields();
        setOpen(true);
    };

    const openEdit = (record) => {
        setEditing(record);
        form.setFieldsValue(record);
        setOpen(true);
    };

    const handleDelete = async (id) => {
        try {
            await axios.delete(`${API_CUSTOMERS}/${id}`);
            message.success("Đã xoá khách hàng");
            fetchCustomers();
        } catch (error) {
            message.error("Lỗi khi xoá khách hàng");
        }
    };

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();

            if (editing) {
                await axios.put(`${API_CUSTOMERS}/${editing.customer_id}`, values);
                message.success("Cập nhật thành công");
            } else {
                await axios.post(API_CUSTOMERS, values);
                message.success("Thêm khách hàng thành công");
            }

            setOpen(false);
            fetchCustomers();
        } catch (error) {
            if (error.response) {
                message.error("Lỗi: " + error.response.data.error);
            }
        }
    };

    const columns = [
        { title: "ID", dataIndex: "customer_id", width: 70 },
        { title: "Tên khách hàng", dataIndex: "customer_name" },
        { title: "Số điện thoại", dataIndex: "phone" },
        {
            title: "Hành động",
            render: (_, r) => (
                <Space>
                    <Button type="link" onClick={() => openEdit(r)}>Sửa</Button>
                    <Popconfirm
                        title="Xoá khách hàng này?"
                        onConfirm={() => handleDelete(r.customer_id)}
                        okText="Có"
                        cancelText="Không"
                    >
                        <Button type="link" danger>Xoá</Button>
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <>
            <Title level={3}>Quản lý khách hàng</Title>

            <Button type="primary" onClick={openAdd} style={{ marginBottom: 16 }}>
                + Thêm khách hàng
            </Button>

            <Table
                rowKey="customer_id"
                columns={columns}
                dataSource={data}
                loading={loading}
            />

            <Modal
                title={editing ? "Sửa thông tin" : "Thêm khách hàng"}
                open={open}
                onOk={handleSubmit}
                onCancel={() => setOpen(false)}
                okText="Lưu"
                cancelText="Hủy"
            >
                <Form form={form} layout="vertical">
                    <Form.Item 
                        name="customer_name" 
                        label="Tên khách hàng" 
                        rules={[{ required: true, message: 'Vui lòng nhập tên khách hàng!' }]}
                    >
                        <Input placeholder="Ví dụ: Nguyễn Văn A" />
                    </Form.Item>

                    <Form.Item 
                        name="phone" 
                        label="Số điện thoại" 
                        rules={[{ required: true, message: 'Vui lòng nhập số điện thoại!' }]}
                    >
                        <Input placeholder="Ví dụ: 0901234567" />
                    </Form.Item>
                </Form>
            </Modal>
        </>
    );
};

export default Customers;