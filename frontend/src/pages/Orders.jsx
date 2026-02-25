import {
    Table, Typography, Button, Modal, Form, Select, InputNumber, DatePicker, Space, Popconfirm, message
} from "antd";
import { useEffect, useState } from "react";
import axios from "axios";
import dayjs from "dayjs"; // Dùng để format ngày tháng

const { Title } = Typography;
const API_ORDERS = "http://localhost:5000/api/orders";
const API_CUSTOMERS = "http://localhost:5000/api/customers";
const API_PRODUCTS = "http://localhost:5000/api/products";

const Orders = () => {
    const [data, setData] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);
    const [form] = Form.useForm();

    const fetchData = async () => {
        setLoading(true);
        try {
            // Tải song song cả 3 danh sách cho nhanh
            const [resOrders, resCustomers, resProducts] = await Promise.all([
                axios.get(API_ORDERS),
                axios.get(API_CUSTOMERS),
                axios.get(API_PRODUCTS)
            ]);
            setData(resOrders.data);
            setCustomers(resCustomers.data);
            setProducts(resProducts.data);
        } catch {
            message.error("Lỗi tải dữ liệu");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const openAdd = () => {
        form.resetFields();
        setOpen(true);
    };

    const handleDelete = async (id) => {
        try {
            await axios.delete(`${API_ORDERS}/${id}`);
            message.success("Đã xoá đơn hàng");
            fetchData();
        } catch (error) {
            message.error("Lỗi khi xoá");
        }
    };

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();
            
            // Format lại ngày tháng để gửi xuống Database
            const payload = {
                ...values,
                order_date: values.order_date.format("YYYY-MM-DD")
            };

            await axios.post(API_ORDERS, payload);
            message.success("Tạo đơn hàng thành công!");
            setOpen(false);
            fetchData();
        } catch (error) {
            if (error.response) {
                message.error("Lỗi: " + error.response.data.error);
            }
        }
    };

    const columns = [
        { title: "Mã ĐH", dataIndex: "order_id", width: 80 },
        { title: "Khách hàng", dataIndex: "customer_name" },
        { 
            title: "Ngày đặt", 
            dataIndex: "order_date",
            render: (date) => dayjs(date).format("DD/MM/YYYY") // Hiển thị ngày kiểu Việt Nam
        },
        {
            title: "Tổng tiền",
            dataIndex: "total_amount",
            render: (v) => <strong style={{color: 'green'}}>{Number(v).toLocaleString()} ₫</strong>,
        },
        {
            title: "Hành động",
            render: (_, r) => (
                <Popconfirm title="Xoá đơn hàng này?" onConfirm={() => handleDelete(r.order_id)}>
                    <Button type="link" danger>Xoá</Button>
                </Popconfirm>
            ),
        },
    ];

    return (
        <>
            <Title level={3}>Quản lý đơn hàng</Title>
            <Button type="primary" onClick={openAdd} style={{ marginBottom: 16 }}>+ Tạo đơn hàng</Button>

            <Table rowKey="order_id" columns={columns} dataSource={data} loading={loading} />

            <Modal
                title="Tạo đơn hàng mới"
                open={open}
                onOk={handleSubmit}
                onCancel={() => setOpen(false)}
                okText="Tạo đơn"
                cancelText="Hủy"
            >
                <Form form={form} layout="vertical">
                    <Form.Item name="customer_id" label="Khách hàng" rules={[{ required: true, message: 'Chọn khách hàng!' }]}>
                        <Select placeholder="-- Chọn khách hàng --">
                            {customers.map(c => (
                                <Select.Option key={c.customer_id} value={c.customer_id}>{c.customer_name} - {c.phone}</Select.Option>
                            ))}
                        </Select>
                    </Form.Item>

                    <Form.Item name="product_id" label="Sản phẩm" rules={[{ required: true, message: 'Chọn sản phẩm!' }]}>
                        <Select placeholder="-- Chọn sản phẩm --">
                            {products.map(p => (
                                <Select.Option key={p.product_id} value={p.product_id} disabled={p.stock <= 0}>
                                    {p.product_name} ({Number(p.price).toLocaleString()}₫) {p.stock <= 0 ? '- Hết hàng' : ''}
                                </Select.Option>
                            ))}
                        </Select>
                    </Form.Item>

                    <Form.Item name="quantity" label="Số lượng" rules={[{ required: true, message: 'Nhập số lượng!' }]}>
                        <InputNumber min={1} style={{ width: "100%" }} placeholder="Nhập số lượng..." />
                    </Form.Item>

                    <Form.Item name="order_date" label="Ngày đặt hàng" rules={[{ required: true, message: 'Chọn ngày!' }]}>
                        <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" placeholder="Chọn ngày..." />
                    </Form.Item>
                </Form>
            </Modal>
        </>
    );
};

export default Orders;