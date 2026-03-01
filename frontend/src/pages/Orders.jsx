import {
    Table, Typography, Button, Modal, Form, Select, InputNumber, DatePicker, Space, Popconfirm, message, Input, Card, Row, Col, Tag
} from "antd";
import { EyeOutlined, DeleteOutlined, ShoppingCartOutlined, SearchOutlined, ReloadOutlined } from "@ant-design/icons";
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
    
    // State theo dõi sản phẩm để chặn số lượng nhập
    const [selectedProduct, setSelectedProduct] = useState(null); 

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
                item.customer_name.toLowerCase().includes(searchText.toLowerCase()) ||
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
        setSelectedProduct(null);
        setOpenAdd(true);
    };

    const handleSubmitCreate = async () => {
        try {
            const values = await form.validateFields();
            const payload = { ...values, order_date: values.order_date.format("YYYY-MM-DD") };
            
            await axios.post(API_ORDERS, payload);
            message.success("Tạo đơn hàng thành công!");
            setOpenAdd(false);
            fetchData(); 
        } catch (error) {
            if (error.response) {
                message.error(error.response.data.error);
            }
        }
    };

    const columns = [
        { 
            title: "STT", 
            key: "index", 
            width: 60, 
            align: 'center', 
            render: (_, __, index) => index + 1 
        },
        { 
            title: "Mã ĐH", 
            dataIndex: "order_id", 
            width: 100, 
            align: 'center', 
            render: id => <Tag color="blue">#{id}</Tag> 
        },
        { 
            title: "Khách hàng", 
            dataIndex: "customer_name", 
            render: t => <strong>{t}</strong> 
        },
        { 
            title: "Ngày đặt", 
            dataIndex: "order_date", 
            render: d => dayjs(d).format("DD/MM/YYYY") 
        },
        { 
            title: "Tổng tiền", 
            dataIndex: "total_amount", 
            align: 'right',
            render: v => <strong style={{color: '#d4380d'}}>{Number(v).toLocaleString()} ₫</strong> 
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
        <>
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

            <Modal 
                title="Tạo đơn hàng mới" 
                open={openAdd} 
                onOk={handleSubmitCreate} 
                onCancel={() => setOpenAdd(false)}
                okText="Xác nhận tạo"
                cancelText="Hủy"
            >
                <Form form={form} layout="vertical" initialValues={{ quantity: 1 }}>
                    <Form.Item name="customer_id" label="Khách hàng" rules={[{ required: true, message: 'Chọn khách hàng' }]}>
                        <Select placeholder="Chọn khách..." showSearch optionFilterProp="children">
                            {customers.map(c => <Select.Option key={c.customer_id} value={c.customer_id}>{c.customer_name} - {c.phone}</Select.Option>)}
                        </Select>
                    </Form.Item>

                    <Form.Item name="product_id" label="Sản phẩm" rules={[{ required: true, message: 'Chọn sản phẩm' }]}>
                        <Select 
                            placeholder="Chọn sản phẩm..." 
                            showSearch 
                            optionFilterProp="children"
                            onChange={(value) => {
                                const prod = products.find(p => p.product_id === value);
                                setSelectedProduct(prod);
                                form.setFieldsValue({ quantity: 1 });
                            }}
                        >
                            {products.map(p => (
                                <Select.Option key={p.product_id} value={p.product_id} disabled={p.stock <= 0}>
                                    {p.product_name} (Kho: {p.stock}) - {Number(p.price).toLocaleString()}₫
                                </Select.Option>
                            ))}
                        </Select>
                    </Form.Item>

                    <Form.Item 
                        name="quantity" 
                        label="Số lượng" 
                        // Hiển thị gợi ý số lượng tồn kho ngay dưới ô nhập
                        extra={selectedProduct ? `Trong kho hiện có: ${selectedProduct.stock} sản phẩm` : ""}
                        rules={[
                            { required: true, message: 'Vui lòng nhập số lượng!' },
                            { type: 'number', min: 1, message: 'Số lượng phải lớn hơn 0' },
                            // Logic kiểm tra và báo lỗi khi nhập quá số lượng
                            () => ({
                                validator(_, value) {
                                    if (selectedProduct && value > selectedProduct.stock) {
                                        return Promise.reject(
                                            new Error(`Không đủ hàng! Bạn nhập ${value} nhưng kho chỉ còn ${selectedProduct.stock}`)
                                        );
                                    }
                                    return Promise.resolve();
                                },
                            }),
                        ]}
                        // Giúp báo lỗi ngay khi đang gõ (vừa gõ quá là hiện đỏ ngay)
                        validateTrigger={["onChange", "onBlur"]}
                    >
                        <InputNumber 
                            min={1} 
                            style={{ width: '100%' }} 
                            placeholder="Nhập số lượng cần mua..."
                            // Bỏ thuộc tính max ở đây để validator có thể bắt lỗi
                        />
                    </Form.Item>

                    <Form.Item name="order_date" label="Ngày đặt" rules={[{ required: true, message: 'Chọn ngày' }]}>
                        <DatePicker style={{width:'100%'}} format="DD/MM/YYYY" defaultValue={dayjs()}/>
                    </Form.Item>
                </Form>
            </Modal>

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
        </>
    );
};

export default Orders;