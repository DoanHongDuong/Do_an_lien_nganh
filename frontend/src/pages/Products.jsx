import {
    Table, Typography, Button, Modal, Form, Input, InputNumber, Space, Popconfirm, message, Select, Image, Tag, Card, Row, Col, Statistic
} from "antd";
import { useEffect, useState } from "react";
import axios from "axios";
import { PlusOutlined, SearchOutlined, InboxOutlined, DollarOutlined } from '@ant-design/icons';

const { Title } = Typography;
const API_PRODUCTS = "http://localhost:5000/api/products";
const API_CATEGORIES = "http://localhost:5000/api/categories";

const Products = () => {
    const [data, setData] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form] = Form.useForm();
    const [file, setFile] = useState(null);
    const [searchText, setSearchText] = useState("");

    const fetchData = async () => {
        setLoading(true);
        try {
            const [resP, resC] = await Promise.all([
                axios.get(API_PRODUCTS),
                axios.get(API_CATEGORIES)
            ]);
            setData(resP.data);
            setCategories(resC.data);
        } catch {
            message.error("Lỗi tải dữ liệu");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    // Filter theo tìm kiếm
    const filteredData = data.filter(item => 
        item.product_name.toLowerCase().includes(searchText.toLowerCase())
    );

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();
            const formData = new FormData();
            Object.keys(values).forEach(key => formData.append(key, values[key]));
            if (file) formData.append('image', file);

            if (editing) {
                await axios.put(`${API_PRODUCTS}/${editing.product_id}`, formData);
                message.success("Cập nhật thành công");
            } else {
                await axios.post(API_PRODUCTS, formData);
                message.success("Thêm thành công");
            }
            setOpen(false);
            setFile(null);
            fetchData();
        } catch (error) { message.error("Lỗi lưu sản phẩm"); }
    };

    const columns = [
        { 
            title: "Ảnh", 
            dataIndex: "image_url", 
            width: 80,
            render: (url) => <Image width={60} src={url || "https://via.placeholder.com/60"} style={{ borderRadius: 8, objectFit: 'cover' }} />
        },
        { 
            title: "Tên sản phẩm", 
            dataIndex: "product_name",
            render: (text) => <strong>{text}</strong>
        },
        { 
            title: "Danh mục", 
            dataIndex: "category_name",
            // Tính năng Filter ngay tại đầu cột
            filters: categories.map(c => ({ text: c.category_name, value: c.category_name })),
            onFilter: (value, record) => record.category_name === value,
            render: (cat) => <Tag color="cyan">{cat}</Tag>
        },
        { 
            title: "Giá bán", 
            dataIndex: "price", 
            align: 'right',
            sorter: (a, b) => a.price - b.price,
            render: (v) => <b style={{ color: '#f5222d' }}>{Number(v).toLocaleString()} ₫</b> 
        },
        { 
            title: "Tồn kho", 
            dataIndex: "stock", 
            align: 'center',
            sorter: (a, b) => a.stock - b.stock,
            render: (s) => <Tag color={s < 5 ? 'volcano' : 'green'}>{s < 5 ? `Sắp hết: ${s}` : s}</Tag>
        },
        {
            title: "Hành động",
            align: 'center',
            render: (_, r) => (
                <Space>
                    <Button type="link" onClick={() => { setEditing(r); form.setFieldsValue(r); setOpen(true); }}>Sửa</Button>
                    <Popconfirm title="Xoá sản phẩm?" onConfirm={() => axios.delete(`${API_PRODUCTS}/${r.product_id}`).then(fetchData)}>
                        <Button type="link" danger>Xoá</Button>
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <div style={{ padding: '20px' }}>
            {/* Phần thống kê nhanh giúp trang chuyên nghiệp hơn */}
            <Row gutter={16} style={{ marginBottom: 20 }}>
                <Col span={8}>
                    <Card size="small">
                        <Statistic title="Tổng sản phẩm" value={data.length} prefix={<InboxOutlined />} />
                    </Card>
                </Col>
                <Col span={8}>
                    <Card size="small">
                        <Statistic title="Giá trị kho" value={data.reduce((sum, item) => sum + (item.price * item.stock), 0)} prefix={<DollarOutlined />} suffix="₫" />
                    </Card>
                </Col>
            </Row>

            <Card title={<Title level={4} style={{ margin: 0 }}>📦 Danh sách kho hàng</Title>}
                extra={
                    <Space>
                        <Input 
                            prefix={<SearchOutlined />} 
                            placeholder="Tìm tên sản phẩm..." 
                            onChange={e => setSearchText(e.target.value)}
                            style={{ width: 250 }}
                        />
                        <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditing(null); form.resetFields(); setOpen(true); }}>
                            Thêm sản phẩm
                        </Button>
                    </Space>
                }>
                <Table 
                    rowKey="product_id" 
                    columns={columns} 
                    dataSource={filteredData} 
                    loading={loading}
                    bordered
                    pagination={{ pageSize: 6 }}
                />
            </Card>

            <Modal title={editing ? "Sửa sản phẩm" : "Thêm sản phẩm"} open={open} onOk={handleSubmit} onCancel={() => setOpen(false)} width={600}>
                <Form form={form} layout="vertical">
                    <Form.Item name="product_name" label="Tên sản phẩm" rules={[{ required: true }]}>
                        <Input placeholder="Nhập tên sản phẩm..." />
                    </Form.Item>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name="category_id" label="Danh mục" rules={[{ required: true }]}>
                                <Select placeholder="Chọn loại">
                                    {categories.map(c => <Select.Option key={c.category_id} value={c.category_id}>{c.category_name}</Select.Option>)}
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="price" label="Giá bán" rules={[{ required: true }]}>
                                <InputNumber style={{ width: '100%' }} formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} suffix="₫" />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Form.Item name="stock" label="Số lượng kho" rules={[{ required: true }]}>
                        <InputNumber style={{ width: '100%' }} min={0} />
                    </Form.Item>
                    <Form.Item label="Hình ảnh sản phẩm">
                        <Input type="file" onChange={e => setFile(e.target.files[0])} accept="image/*" />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default Products;