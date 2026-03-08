import React, { useEffect, useState } from "react";
import {
    Table, Typography, Button, Modal, Form, Input, InputNumber, Space, 
    Popconfirm, message, Select, Image, Tag, Card, Row, Col, Statistic, DatePicker
} from "antd";
import axios from "axios";
import { 
    PlusOutlined, SearchOutlined, InboxOutlined, 
    DollarOutlined, CalendarOutlined, ReloadOutlined 
} from '@ant-design/icons';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';

// Kích hoạt plugin kiểm tra khoảng thời gian cho dayjs
dayjs.extend(isBetween);

const { Title } = Typography;
const { RangePicker } = DatePicker;
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
    const [dateRange, setDateRange] = useState(null);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [resP, resC] = await Promise.all([
                axios.get(API_PRODUCTS),
                axios.get(API_CATEGORIES)
            ]);
            setData(resP.data);
            setCategories(resC.data);
        } catch (error) {
            message.error("Lỗi tải dữ liệu: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    // --- LOGIC LỌC DỮ LIỆU ---
    const filteredData = data.filter(item => {
        const matchName = item.product_name.toLowerCase().includes(searchText.toLowerCase());
        
        let matchDate = true;
        if (dateRange && dateRange[0] && dateRange[1]) {
            const start = dateRange[0].startOf('day');
            const end = dateRange[1].endOf('day');
            const itemDate = dayjs(item.entry_date);
            // Kiểm tra itemDate có nằm trong khoảng [start, end]
            matchDate = itemDate.isBetween(start, end, null, '[]');
        }
        return matchName && matchDate;
    });

    // --- XỬ LÝ LƯU DỮ LIỆU ---
    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();
            const formData = new FormData();
            
            Object.keys(values).forEach(key => {
                if (values[key] !== undefined && values[key] !== null) {
                    formData.append(key, values[key]);
                }
            });

            if (file) formData.append('image', file);

            if (editing) {
                await axios.put(`${API_PRODUCTS}/${editing.product_id}`, formData);
                message.success("Cập nhật sản phẩm thành công");
            } else {
                await axios.post(API_PRODUCTS, formData);
                message.success("Thêm sản phẩm mới thành công");
            }
            
            setOpen(false);
            setFile(null);
            setEditing(null);
            fetchData();
        } catch (error) {
            console.error(error);
            message.error("Lỗi khi lưu sản phẩm");
        }
    };

    // --- CẤU HÌNH CỘT BẢNG ---
    const columns = [
        { 
            title: "Ảnh", 
            dataIndex: "image_url", 
            width: 90,
            render: (url) => <Image width={60} src={url || "https://via.placeholder.com/60"} style={{ borderRadius: 8, objectFit: 'cover' }} />
        },
        { 
            title: "Thông tin sản phẩm", 
            dataIndex: "product_name",
            render: (text, record) => {
                // Tag NEW nếu nhập trong vòng 7 ngày
                const isNew = record.entry_date && dayjs().diff(dayjs(record.entry_date), 'day') <= 7;
                return (
                    <Space direction="vertical" size={0}>
                        <Space>
                            <strong style={{ fontSize: '15px' }}>{text}</strong>
                            {isNew && <Tag color="magenta">NEW</Tag>}
                        </Space>
                        <Tag color="blue">{record.category_name}</Tag>
                    </Space>
                );
            }
        },
        { 
            title: "Ngày nhập", 
            dataIndex: "entry_date",
            align: 'center',
            sorter: (a, b) => new Date(a.entry_date) - new Date(b.entry_date),
            render: (date) => date ? dayjs(date).format('DD/MM/YYYY') : <span style={{color: '#bfbfbf'}}>N/A</span>
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
            render: (s) => (
                <Tag color={s < 5 ? 'volcano' : 'green'} style={{ fontWeight: 'bold' }}>
                    {s < 5 ? `Cảnh báo: ${s}` : s}
                </Tag>
            )
        },
        {
            title: "Hành động",
            align: 'center',
            render: (_, r) => (
                <Space>
                    <Button type="primary" ghost size="small" onClick={() => { 
                        setEditing(r); 
                        // Chuyển đổi entry_date sang định dạng YYYY-MM-DD cho input type date
                        const formattedValues = {
                            ...r,
                            entry_date: r.entry_date ? dayjs(r.entry_date).format('YYYY-MM-DD') : null
                        };
                        form.setFieldsValue(formattedValues); 
                        setOpen(true); 
                    }}>Sửa</Button>
                    <Popconfirm title="Xác nhận xoá sản phẩm này?" onConfirm={() => axios.delete(`${API_PRODUCTS}/${r.product_id}`).then(fetchData)}>
                        <Button type="primary" danger size="small">Xoá</Button>
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <div style={{ padding: '24px', background: '#f5f5f5', minHeight: '100vh' }}>
            {/* THỐNG KÊ NHANH */}
            <Row gutter={16} style={{ marginBottom: 24 }}>
                <Col span={8}>
                    <Card bordered={false} className="shadow-sm">
                        <Statistic title="Mặt hàng hiện có" value={data.length} prefix={<InboxOutlined />} valueStyle={{ color: '#3f51b5' }} />
                    </Card>
                </Col>
                <Col span={8}>
                    <Card bordered={false} className="shadow-sm">
                        <Statistic 
                            title="Tổng vốn tồn kho (Theo bộ lọc)" 
                            value={filteredData.reduce((sum, item) => sum + (item.cost_price * item.stock), 0)} 
                            prefix={<DollarOutlined />} 
                            suffix="₫"
                            valueStyle={{ color: '#cf1322' }} 
                        />
                    </Card>
                </Col>
                <Col span={8}>
                    <Card bordered={false} className="shadow-sm">
                        <Statistic 
                            title="Giá trị niêm yết" 
                            value={filteredData.reduce((sum, item) => sum + (item.price * item.stock), 0)} 
                            prefix={<CalendarOutlined />} 
                            suffix="₫"
                            valueStyle={{ color: '#389e0d' }} 
                        />
                    </Card>
                </Col>
            </Row>

            <Card 
                title={<Title level={4} style={{ margin: 0 }}>📦 Quản lý kho hàng sản phẩm</Title>}
                extra={
                    <Space wrap>
                        <Input 
                            prefix={<SearchOutlined />} 
                            placeholder="Tìm tên sản phẩm..." 
                            allowClear
                            onChange={e => setSearchText(e.target.value)}
                            style={{ width: 220 }}
                        />
                        <RangePicker 
                            placeholder={['Từ ngày', 'Đến ngày']}
                            format="DD/MM/YYYY"
                            onChange={(dates) => setDateRange(dates)}
                            style={{ width: 280 }}
                        />
                        <Button icon={<ReloadOutlined />} onClick={fetchData} />
                        <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditing(null); form.resetFields(); setOpen(true); }}>
                            Thêm sản phẩm
                        </Button>
                    </Space>
                }
                bordered={false}
                className="shadow-sm"
            >
                <Table 
                    rowKey="product_id" 
                    columns={columns} 
                    dataSource={filteredData} 
                    loading={loading}
                    bordered
                    pagination={{ pageSize: 7, showTotal: (total) => `Tổng cộng ${total} sản phẩm` }}
                />
            </Card>

            {/* MODAL THÊM/SỬA */}
            <Modal 
                title={editing ? "Cập nhật sản phẩm" : "Thêm sản phẩm mới"} 
                open={open} 
                onOk={handleSubmit} 
                onCancel={() => setOpen(false)} 
                width={700}
                okText="Lưu dữ liệu"
                cancelText="Hủy bỏ"
                destroyOnClose
            >
                <Form form={form} layout="vertical" style={{ marginTop: '20px' }}>
                    <Form.Item name="product_name" label="Tên sản phẩm" rules={[{ required: true, message: 'Vui lòng nhập tên!' }]}>
                        <Input placeholder="Ví dụ: Vợt Yonex Astrox 100ZZ" />
                    </Form.Item>
                    
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name="category_id" label="Danh mục" rules={[{ required: true }]}>
                                <Select placeholder="Chọn loại sản phẩm">
                                    {categories.map(c => <Select.Option key={c.category_id} value={c.category_id}>{c.category_name}</Select.Option>)}
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="entry_date" label="Ngày nhập kho">
                                <Input type="date" style={{ width: '100%' }} />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Row gutter={16}>
                        <Col span={8}>
                            <Form.Item name="cost_price" label="Giá nhập (Vốn)" rules={[{ required: true }]}>
                                <InputNumber 
                                    style={{ width: '100%' }} 
                                    formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} 
                                    addonAfter="₫" 
                                />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item name="price" label="Giá bán niêm yết" rules={[{ required: true }]}>
                                <InputNumber 
                                    style={{ width: '100%' }} 
                                    formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} 
                                    addonAfter="₫" 
                                />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item name="stock" label="Số lượng nhập" rules={[{ required: true }]}>
                                <InputNumber style={{ width: '100%' }} min={0} placeholder="0" />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Form.Item label="Hình ảnh minh họa">
                        <Input type="file" onChange={e => setFile(e.target.files[0])} accept="image/*" />
                        {editing && !file && <p style={{ marginTop: 5, color: '#8c8c8c' }}>Ảnh hiện tại: {editing.image_url}</p>}
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default Products;