import {
    Table, Typography, Button, Modal, Form, Select, InputNumber, DatePicker, 
    Space, Popconfirm, message, Input, Card, Row, Col, Tag, Divider
} from "antd";
import { 
    EyeOutlined, DeleteOutlined, ShoppingCartOutlined, 
    SearchOutlined, ReloadOutlined, PlusOutlined 
} from "@ant-design/icons";
import { useEffect, useState } from "react";
import axios from "axios";
import dayjs from "dayjs";

const { Title } = Typography;
const { RangePicker } = DatePicker;

const API_ORDERS = "http://localhost:5000/api/orders";
const API_CUSTOMERS = "http://localhost:5000/api/customers";
const API_PRODUCTS = "http://localhost:5000/api/products";

const Orders = () => {
    const [data, setData] = useState([]);
    const [filteredData, setFilteredData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchText, setSearchText] = useState("");
    const [dateRange, setDateRange] = useState(null);

    const [customers, setCustomers] = useState([]);
    const [products, setProducts] = useState([]);
    const [openAdd, setOpenAdd] = useState(false);
    const [form] = Form.useForm();

    const [openDetails, setOpenDetails] = useState(false);
    const [currentOrderItems, setCurrentOrderItems] = useState([]);
    const [currentOrderId, setCurrentOrderId] = useState(null);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [resOrders, resCustomers, resProducts] = await Promise.all([
                axios.get(API_ORDERS),
                axios.get(API_CUSTOMERS),
                axios.get(API_PRODUCTS)
            ]);
            setData(resOrders.data);
            setFilteredData(resOrders.data);
            setCustomers(resCustomers.data);
            setProducts(resProducts.data);
        } catch {
            message.error("Lỗi tải dữ liệu");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    // Xử lý bộ lọc
    useEffect(() => {
        let temp = [...data];
        if (searchText) {
            temp = temp.filter(item =>
                item.customer_name?.toLowerCase().includes(searchText.toLowerCase()) ||
                item.order_id.toString().includes(searchText)
            );
        }
        if (dateRange) {
            const start = dateRange[0].startOf('day');
            const end = dateRange[1].endOf('day');
            temp = temp.filter(item => {
                const orderDate = dayjs(item.order_date);
                return orderDate >= start && orderDate <= end;
            });
        }
        setFilteredData(temp);
    }, [searchText, dateRange, data]);

    const handleViewDetails = async (orderId) => {
        setCurrentOrderId(orderId);
        try {
            const res = await axios.get(`${API_ORDERS}/${orderId}/items`);
            setCurrentOrderItems(res.data);
            setOpenDetails(true);
        } catch (error) {
            message.error("Lỗi tải chi tiết");
        }
    };

    const handleDelete = async (id) => {
        try {
            await axios.delete(`${API_ORDERS}/${id}`);
            message.success("Đã xoá đơn hàng và hoàn lại kho");
            fetchData();
        } catch (error) {
            message.error("Lỗi khi xoá");
        }
    };

    const handleCreate = () => {
        form.resetFields();
        setOpenAdd(true);
    };

    const handleSubmitCreate = async () => {
        try {
            const values = await form.validateFields();
            // Payload sẽ chứa customer_id, order_date và mảng items
            const payload = { 
                ...values, 
                order_date: values.order_date.format("YYYY-MM-DD") 
            };

            await axios.post(API_ORDERS, payload);
            message.success("Tạo đơn hàng thành công!");
            setOpenAdd(false);
            fetchData();
        } catch (error) {
            if (error.response) {
                message.error(error.response.data.error || "Lỗi từ máy chủ");
            }
        }
    };

    const columns = [
        { title: "STT", key: "index", width: 60, align: 'center', render: (_, __, index) => index + 1 },
        { title: "Mã ĐH", dataIndex: "order_id", width: 100, align: 'center', render: id => <Tag color="blue">#{id}</Tag> },
        { title: "Khách hàng", dataIndex: "customer_name", render: t => <strong>{t}</strong> },
        { title: "Ngày đặt", dataIndex: "order_date", render: d => dayjs(d).format("DD/MM/YYYY") },
        { 
            title: "Tổng tiền", 
            dataIndex: "total_amount", 
            align: 'right', 
            render: v => <strong style={{ color: '#d4380d' }}>{Number(v).toLocaleString()} ₫</strong> 
        },
        {
            title: "Hành động",
            align: 'center',
            render: (_, r) => (
                <Space>
                    <Button type="primary" ghost icon={<EyeOutlined />} onClick={() => handleViewDetails(r.order_id)}>Chi tiết</Button>
                    <Popconfirm title="Xoá đơn này và hoàn lại kho?" onConfirm={() => handleDelete(r.order_id)}>
                        <Button type="primary" danger icon={<DeleteOutlined />} />
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <div style={{ padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <Title level={3} style={{ margin: 0 }}>Quản lý đơn hàng</Title>
                <Button type="primary" icon={<ShoppingCartOutlined />} onClick={handleCreate} size="large">
                    Tạo đơn hàng
                </Button>
            </div>

            <Card style={{ marginBottom: 20 }} size="small">
                <Row gutter={16}>
                    <Col span={10}>
                        <Input
                            prefix={<SearchOutlined />}
                            placeholder="Tìm theo tên khách hoặc mã đơn..."
                            value={searchText}
                            onChange={e => setSearchText(e.target.value)}
                        />
                    </Col>
                    <Col span={10}>
                        <RangePicker
                            style={{ width: '100%' }}
                            format="DD/MM/YYYY"
                            onChange={(dates) => setDateRange(dates)}
                        />
                    </Col>
                    <Col span={4}>
                        <Button block icon={<ReloadOutlined />} onClick={fetchData}>Làm mới</Button>
                    </Col>
                </Row>
            </Card>

            <Table
                rowKey="order_id"
                columns={columns}
                dataSource={filteredData}
                loading={loading}
                pagination={{ pageSize: 8 }}
                bordered
            />

            {/* MODAL TẠO ĐƠN HÀNG NHIỀU SẢN PHẨM */}
            <Modal
                title="Tạo đơn hàng mới"
                open={openAdd}
                onOk={handleSubmitCreate}
                onCancel={() => setOpenAdd(false)}
                okText="Xác nhận tạo"
                cancelText="Hủy"
                width={700}
                style={{ top: 20 }}
            >
                <Form form={form} layout="vertical" initialValues={{ order_date: dayjs(), items: [{ quantity: 1 }] }}>
                    <Row gutter={16}>
                        <Col span={14}>
                            <Form.Item name="customer_id" label="Khách hàng" rules={[{ required: true, message: 'Chọn khách hàng' }]}>
                                <Select placeholder="Chọn khách..." showSearch optionFilterProp="children">
                                    {customers.map(c => (
                                        <Select.Option key={c.customer_id} value={c.customer_id}>
                                            {c.customer_name} - {c.phone}
                                        </Select.Option>
                                    ))}
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col span={10}>
                            <Form.Item name="order_date" label="Ngày đặt" rules={[{ required: true, message: 'Chọn ngày' }]}>
                                <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Divider orientation="left" style={{ fontSize: 14, color: '#1890ff' }}>Sản phẩm đã chọn</Divider>

                    <Form.List name="items">
                        {(fields, { add, remove }) => (
                            <>
                                {fields.map(({ key, name, ...restField }) => (
                                    <Card size="small" key={key} style={{ marginBottom: 12, border: '1px solid #f0f0f0' }}>
                                        <Row gutter={12} align="middle">
                                            <Col span={14}>
                                                <Form.Item
                                                    {...restField}
                                                    name={[name, 'product_id']}
                                                    label="Tên sản phẩm"
                                                    rules={[{ required: true, message: 'Bắt buộc' }]}
                                                >
                                                    <Select
                                                        placeholder="Chọn sản phẩm"
                                                        showSearch
                                                        optionFilterProp="children"
                                                        onChange={() => {
                                                            const items = form.getFieldValue('items');
                                                            items[name].quantity = 1;
                                                            form.setFieldsValue({ items });
                                                        }}
                                                    >
                                                        {products.map(p => (
                                                            <Select.Option key={p.product_id} value={p.product_id} disabled={p.stock <= 0}>
                                                                {p.product_name} ({p.stock}) - {Number(p.price).toLocaleString()}₫
                                                            </Select.Option>
                                                        ))}
                                                    </Select>
                                                </Form.Item>
                                            </Col>
                                            <Col span={7}>
                                                <Form.Item
                                                    {...restField}
                                                    name={[name, 'quantity']}
                                                    label="SL"
                                                    rules={[
                                                        { required: true, message: 'SL?' },
                                                        ({ getFieldValue }) => ({
                                                            validator(_, value) {
                                                                const prodId = getFieldValue(['items', name, 'product_id']);
                                                                const product = products.find(p => p.product_id === prodId);
                                                                if (product && value > product.stock) {
                                                                    return Promise.reject(new Error(`Tối đa ${product.stock}`));
                                                                }
                                                                return Promise.resolve();
                                                            },
                                                        }),
                                                    ]}
                                                >
                                                    <InputNumber min={1} style={{ width: '100%' }} />
                                                </Form.Item>
                                            </Col>
                                            <Col span={3} style={{ textAlign: 'center' }}>
                                                {fields.length > 1 && (
                                                    <Button type="text" danger icon={<DeleteOutlined />} onClick={() => remove(name)} style={{ marginTop: 8 }} />
                                                )}
                                            </Col>
                                        </Row>
                                    </Card>
                                ))}
                                <Button type="dashed" onClick={() => add({ quantity: 1 })} block icon={<PlusOutlined />}>
                                    Thêm sản phẩm vào đơn
                                </Button>
                            </>
                        )}
                    </Form.List>
                </Form>
            </Modal>

            {/* MODAL CHI TIẾT */}
            <Modal title={`Chi tiết đơn hàng #${currentOrderId}`} open={openDetails} onCancel={() => setOpenDetails(false)} footer={null} width={700}>
                <Table
                    rowKey="order_item_id"
                    columns={[
                        { title: "Sản phẩm", dataIndex: "product_name" },
                        { title: "Số lượng", dataIndex: "quantity", align: 'center' },
                        { title: "Đơn giá", dataIndex: "price", render: v => `${Number(v).toLocaleString()} ₫` },
                        { title: "Thành tiền", render: (_, r) => <strong>{(r.quantity * r.price).toLocaleString()} ₫</strong> }
                    ]}
                    dataSource={currentOrderItems}
                    pagination={false}
                    bordered
                />
            </Modal>
        </div>
    );
};

export default Orders;